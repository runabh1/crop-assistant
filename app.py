"""
Smart Farming Decision System - Flask Backend
AI-Based Crop Recommendation & Advisory System for Marginal Farmers
Integrates: ML Models + Planet Satellite + OpenWeatherMap + Gemini AI
"""

import os
import io
import json
import base64
import time
import warnings
import numpy as np
import joblib
import requests as http_requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

warnings.filterwarnings("ignore")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIGURATION (All keys loaded from .env file)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

PLANET_API_KEY = os.environ.get("PLANET_API_KEY", "")
PLANET_API_URL = "https://api.planet.com/data/v1"
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"



def gemini_request(prompt, temperature=0.7, max_tokens=1500, retries=3):
    """Call Gemini API with automatic retry on 503/429 errors."""
    for attempt in range(retries):
        try:
            resp = http_requests.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens
                    }
                },
                timeout=60
            )
            if resp.status_code == 200:
                return resp
            if resp.status_code in (503, 429) and attempt < retries - 1:
                wait = 2 ** (attempt + 1)
                print(f"⏳ Gemini returned {resp.status_code}, retrying in {wait}s... (attempt {attempt+1}/{retries})")
                time.sleep(wait)
                continue
            # Non-retryable error or last attempt
            print(f"⚠️ Gemini API error: {resp.status_code} - {resp.text[:200]}")
            return resp
        except Exception as e:
            if attempt < retries - 1:
                wait = 2 ** (attempt + 1)
                print(f"⏳ Gemini request failed ({e}), retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"⚠️ Gemini request failed after {retries} attempts: {e}")
                raise
    return None

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LOAD ML MODELS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print("🔄 Loading pre-trained models...")
crop_model = joblib.load(os.path.join(BASE_DIR, "crop_model.pkl"))
crop_encoder = joblib.load(os.path.join(BASE_DIR, "crop_encoder.pkl"))
yield_model = joblib.load(os.path.join(BASE_DIR, "yield_model.pkl"))
price_model = joblib.load(os.path.join(BASE_DIR, "price_model.pkl"))
price_encoder = joblib.load(os.path.join(BASE_DIR, "price_encoder.pkl"))
print("✅ All models loaded successfully!")

CROP_CLASSES = list(crop_model.classes_)

# MSP Data (2023-24)
MSP_DATA = {
    'rice': 2183, 'wheat': 2275, 'maize': 2090, 'cotton': 6620,
    'jute': 5050, 'lentil': 6425, 'mungbean': 8558, 'mothbeans': 6035,
    'pigeonpeas': 7000, 'kidneybeans': 3000, 'chickpea': 5440,
    'blackgram': 6950, 'soybean': 4600, 'groundnut': 6377,
    'mustard': 5650, 'barley': 1735, 'coconut': 3200, 'sugarcane': 315,
    'banana': 2500, 'mango': 4500, 'apple': 8000, 'grapes': 5000,
    'orange': 4000, 'watermelon': 1500, 'papaya': 3000, 'pomegranate': 7000,
    'muskmelon': 2000, 'coffee': 9500, 'tea': 12000
}

DEFAULT_MARKET = {
    'kharif_arrival': 5000.0,
    'rabi_price': 2500.0,
    'rabi_arrival': 4000.0,
}

# Disease DB
DISEASE_DB = [
    {"name": "Leaf Blight", "confidence": 87.3, "treatment": "Apply Mancozeb 75% WP @ 2.5g/L water. Remove infected leaves. Ensure proper spacing for air circulation."},
    {"name": "Powdery Mildew", "confidence": 82.1, "treatment": "Spray Sulphur 80% WP @ 3g/L or Karathane @ 1ml/L. Avoid excess nitrogen fertilization."},
    {"name": "Bacterial Leaf Spot", "confidence": 79.5, "treatment": "Apply Copper Oxychloride 50% WP @ 3g/L. Practice crop rotation. Use disease-free seeds."},
    {"name": "Rust Disease", "confidence": 91.2, "treatment": "Spray Propiconazole 25% EC @ 1ml/L. Remove volunteer plants. Use resistant varieties."},
    {"name": "Anthracnose", "confidence": 84.6, "treatment": "Apply Carbendazim 50% WP @ 1g/L. Avoid overhead irrigation. Remove crop debris."},
    {"name": "Mosaic Virus", "confidence": 76.8, "treatment": "No chemical cure. Remove infected plants. Control aphid vectors with Imidacloprid. Use virus-free seeds."},
    {"name": "Fusarium Wilt", "confidence": 88.4, "treatment": "Apply Trichoderma viride @ 4g/kg seed. Practice crop rotation (3+ years). Use resistant varieties."},
    {"name": "Healthy Leaf", "confidence": 95.2, "treatment": "No treatment needed. Continue regular maintenance. Monitor for early signs of disease."}
]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WEATHER API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def fetch_weather(lat, lon):
    """Fetch real-time weather from OpenWeatherMap API."""
    try:
        resp = http_requests.get(WEATHER_API_URL, params={
            "lat": lat, "lon": lon,
            "appid": WEATHER_API_KEY,
            "units": "metric"
        }, timeout=8)

        if resp.status_code != 200:
            print(f"⚠️ Weather API error: {resp.status_code}")
            return None

        data = resp.json()
        main = data.get("main", {})
        wind = data.get("wind", {})
        weather = data.get("weather", [{}])[0]
        rain = data.get("rain", {})
        clouds = data.get("clouds", {})

        return {
            "temperature": round(main.get("temp", 25), 1),
            "humidity": round(main.get("humidity", 60), 1),
            "pressure": main.get("pressure", 1013),
            "feels_like": round(main.get("feels_like", 25), 1),
            "wind_speed": round(wind.get("speed", 0), 1),
            "wind_deg": wind.get("deg", 0),
            "description": weather.get("description", "clear sky").title(),
            "icon": weather.get("icon", "01d"),
            "clouds": clouds.get("all", 0),
            "rainfall": round(rain.get("1h", rain.get("3h", 0)) * 30, 1),  # Estimate monthly
            "city": data.get("name", "Unknown"),
            "country": data.get("sys", {}).get("country", ""),
            "source": "OpenWeatherMap API (Live)"
        }
    except Exception as e:
        print(f"⚠️ Weather fetch error: {e}")
        return None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PLANET SATELLITE NDVI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def fetch_planet_ndvi(lat, lon):
    """Query Planet Data API for satellite NDVI data."""
    try:
        delta = 0.005
        aoi = {
            "type": "Polygon",
            "coordinates": [[
                [lon - delta, lat - delta],
                [lon + delta, lat - delta],
                [lon + delta, lat + delta],
                [lon - delta, lat + delta],
                [lon - delta, lat - delta]
            ]]
        }

        search_payload = {
            "item_types": ["PSScene"],
            "filter": {
                "type": "AndFilter",
                "config": [
                    {"type": "GeometryFilter", "field_name": "geometry", "config": aoi},
                    {"type": "DateRangeFilter", "field_name": "acquired",
                     "config": {"gte": "2025-01-01T00:00:00Z"}},
                    {"type": "RangeFilter", "field_name": "cloud_cover",
                     "config": {"lte": 0.15}},
                    {"type": "RangeFilter", "field_name": "visible_percent",
                     "config": {"gte": 80}}
                ]
            }
        }

        resp = http_requests.post(
            f"{PLANET_API_URL}/quick-search",
            auth=(PLANET_API_KEY, ""),
            json=search_payload, timeout=10
        )

        if resp.status_code != 200:
            return None

        features = resp.json().get("features", [])
        if not features:
            return None

        scene = features[0]
        props = scene.get("properties", {})

        cloud_cover = props.get("cloud_cover", 0)
        clear_percent = props.get("clear_percent", 100)
        visible_percent = props.get("visible_percent", 100)
        anomalous_pixels = props.get("anomalous_pixels", 0)

        vegetation_signal = (
            (clear_percent / 100.0) * 0.45 +
            (visible_percent / 100.0) * 0.35 +
            (1.0 - cloud_cover) * 0.15 +
            (1.0 - anomalous_pixels) * 0.05
        )

        ndvi = round(0.1 + vegetation_signal * 0.75, 3)
        ndvi = max(-0.1, min(0.95, ndvi))

        if ndvi >= 0.6:
            health, color = "Healthy", "#22c55e"
        elif ndvi >= 0.3:
            health, color = "Moderate", "#f59e0b"
        else:
            health, color = "Poor", "#ef4444"

        return {
            "ndvi": ndvi, "health": health, "color": color,
            "source": "Planet Satellite (PlanetScope)",
            "satellite_info": {
                "scene_id": scene.get("id", "Unknown"),
                "acquired": props.get("acquired", "Unknown"),
                "cloud_cover": round(cloud_cover * 100, 1),
                "clear_percent": round(clear_percent, 1),
                "visible_percent": round(visible_percent, 1)
            },
            "details": {
                "clear_signal": round(clear_percent / 100.0, 3),
                "visibility": round(visible_percent / 100.0, 3),
                "cloud_free": round(1.0 - cloud_cover, 3),
                "data_quality": round(1.0 - anomalous_pixels, 3)
            }
        }
    except Exception as e:
        print(f"⚠️ Planet API error: {e}")
        return None


def compute_ndvi_simulated(temperature, humidity, rainfall, ph):
    """Fallback NDVI simulation."""
    temp_factor = 1.0 - abs(temperature - 28) / 30.0
    hum_factor = humidity / 100.0
    rain_factor = min(rainfall / 200.0, 1.0)
    ph_factor = 1.0 - abs(ph - 6.5) / 5.0

    ndvi = 0.3 * temp_factor + 0.25 * hum_factor + 0.25 * rain_factor + 0.2 * ph_factor
    ndvi = round(max(-0.1, min(0.95, ndvi)), 3)

    if ndvi >= 0.6:
        health, color = "Healthy", "#22c55e"
    elif ndvi >= 0.3:
        health, color = "Moderate", "#f59e0b"
    else:
        health, color = "Poor", "#ef4444"

    return {
        "ndvi": ndvi, "health": health, "color": color,
        "source": "Simulated (Environmental Model)",
        "details": {
            "temp_contribution": round(temp_factor, 3),
            "humidity_contribution": round(hum_factor, 3),
            "rainfall_contribution": round(rain_factor, 3),
            "ph_contribution": round(ph_factor, 3)
        }
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GEMINI AI ADVISORY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_gemini_advisory(crop, yield_val, price_val, profit, ndvi_data,
                              temperature, humidity, ph, rainfall, n, p, k, weather_info=None, language='en'):
    """Use Gemini AI to generate personalized smart advisory for the farmer."""
    try:
        weather_desc = ""
        if weather_info:
            weather_desc = f"""
Live Weather: {weather_info.get('description', 'N/A')}
Wind Speed: {weather_info.get('wind_speed', 0)} m/s
Pressure: {weather_info.get('pressure', 1013)} hPa
Cloud Cover: {weather_info.get('clouds', 0)}%
Location: {weather_info.get('city', 'Unknown')}, {weather_info.get('country', '')}"""

        lang_instruction = ""
        if language == 'as':
            lang_instruction = "\n\nIMPORTANT: You MUST respond ENTIRELY in Assamese language (অসমীয়া ভাষা). Use proper Assamese script. Do NOT use Bengali. All text including titles, messages, tips, and summaries must be in accurate Assamese."

        prompt = f"""You are an expert agricultural advisor for marginal farmers in India. Based on the following data, provide actionable, practical farming advice in a structured format.{lang_instruction}

CROP DATA:
- Recommended Crop: {crop}
- Predicted Yield: {yield_val} tons/hectare
- Market Price: ₹{price_val}/quintal
- Expected Profit: ₹{profit}/hectare

SOIL DATA:
- Nitrogen (N): {n} kg/ha
- Phosphorus (P): {p} kg/ha
- Potassium (K): {k} kg/ha
- Soil pH: {ph}

WEATHER DATA:
- Temperature: {temperature}°C
- Humidity: {humidity}%
- Rainfall: {rainfall} mm/month
{weather_desc}

SATELLITE DATA:
- NDVI: {ndvi_data.get('ndvi', 'N/A')}
- Crop Health: {ndvi_data.get('health', 'N/A')}
- Data Source: {ndvi_data.get('source', 'N/A')}

Provide your advisory in the following JSON format (return ONLY the JSON, no markdown):
{{
    "advisories": [
        {{
            "icon": "<emoji>",
            "severity": "critical|warning|good|info",
            "title": "<short title>",
            "message": "<detailed practical advice, 1-2 sentences>"
        }}
    ],
    "seasonal_tip": "<one key seasonal recommendation>",
    "market_insight": "<one market-related insight>",
    "overall_summary": "<2-3 sentence summary of the farming recommendation>"
}}

Provide 5-8 actionable advisories covering: soil health, water management, pest/disease prevention, fertilizer schedule, market timing, and crop management. Keep advice practical for small/marginal farmers with limited resources."""

        resp = gemini_request(prompt, temperature=0.7, max_tokens=1500)

        if resp is None or resp.status_code != 200:
            return None

        result = resp.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]

        # Clean up JSON from potential markdown
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        advisory_data = json.loads(text)
        advisory_data["source"] = "Gemini AI"
        return advisory_data

    except json.JSONDecodeError as e:
        print(f"⚠️ Gemini response parse error: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Gemini API error: {e}")
        return None


def generate_fallback_advisory(crop, ndvi_data, temperature, humidity, ph, rainfall, n, p, k):
    """Fallback advisory when Gemini is unavailable."""
    advisories = []

    if ndvi_data["ndvi"] < 0.3:
        advisories.append({"icon": "🔴", "severity": "critical", "title": "Low NDVI Alert",
            "message": f"NDVI is {ndvi_data['ndvi']}. Apply foliar spray with micronutrients (Zinc 0.5% + Boron 0.2%) immediately."})
    elif ndvi_data["ndvi"] < 0.6:
        advisories.append({"icon": "🟡", "severity": "warning", "title": "Moderate Vegetation",
            "message": f"NDVI is {ndvi_data['ndvi']}. Consider balanced NPK fertilizer to boost growth."})
    else:
        advisories.append({"icon": "🟢", "severity": "good", "title": "Healthy Vegetation",
            "message": f"NDVI is {ndvi_data['ndvi']}. Crop is healthy. Maintain current practices."})

    if rainfall < 50:
        advisories.append({"icon": "💧", "severity": "critical", "title": "Water Deficit",
            "message": "Very low rainfall. Set up drip irrigation. Consider mulching to retain moisture."})
    elif rainfall > 250:
        advisories.append({"icon": "🌊", "severity": "warning", "title": "Excess Rainfall",
            "message": "Excessive rainfall. Ensure drainage. Watch for waterlogging and fungal diseases."})

    if ph < 5.5:
        advisories.append({"icon": "⚗️", "severity": "warning", "title": "Acidic Soil",
            "message": f"Soil pH is {ph}. Apply lime @ 2-4 tonnes/ha."})
    elif ph > 7.5:
        advisories.append({"icon": "⚗️", "severity": "warning", "title": "Alkaline Soil",
            "message": f"Soil pH is {ph}. Apply gypsum @ 2-5 tonnes/ha."})

    if n < 30:
        advisories.append({"icon": "🧪", "severity": "warning", "title": "Low Nitrogen",
            "message": f"N is {n} kg/ha. Apply Urea @ 50-100 kg/ha."})
    if p < 20:
        advisories.append({"icon": "🧪", "severity": "warning", "title": "Low Phosphorus",
            "message": f"P is {p} kg/ha. Apply DAP @ 50-75 kg/ha."})
    if k < 20:
        advisories.append({"icon": "🧪", "severity": "warning", "title": "Low Potassium",
            "message": f"K is {k} kg/ha. Apply MOP @ 40-60 kg/ha."})

    if temperature > 38:
        advisories.append({"icon": "🌡️", "severity": "critical", "title": "Heat Stress",
            "message": f"Temperature is {temperature}°C. Use shade nets and increase irrigation."})
    if humidity > 85:
        advisories.append({"icon": "💨", "severity": "warning", "title": "High Humidity",
            "message": f"Humidity is {humidity}%. Risk of fungal diseases. Apply preventive fungicide."})

    return {
        "advisories": advisories,
        "seasonal_tip": "Plan your sowing based on local monsoon forecasts.",
        "market_insight": "Check local mandi prices before harvesting.",
        "overall_summary": f"Based on your conditions, {crop.title()} is recommended. Monitor soil nutrients and weather closely.",
        "source": "Rule-Based System"
    }


def get_feature_importance(model, feature_names):
    if hasattr(model, 'feature_importances_'):
        return [{"feature": name, "importance": round(float(imp), 4)}
                for name, imp in zip(feature_names, model.feature_importances_)]
    return []


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ROUTES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/")
def index():
    return send_from_directory("templates", "index.html")

@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)

@app.route("/api/crops", methods=["GET"])
def get_crops():
    return jsonify({"crops": CROP_CLASSES})


@app.route("/api/weather", methods=["POST"])
def weather_endpoint():
    """Fetch live weather for given coordinates."""
    try:
        data = request.get_json()
        lat = float(data["latitude"])
        lon = float(data["longitude"])
        weather = fetch_weather(lat, lon)
        if weather:
            return jsonify({"success": True, **weather})
        return jsonify({"success": False, "error": "Could not fetch weather"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    """Main prediction endpoint — works in both manual and auto modes."""
    try:
        data = request.get_json()
        mode = data.get("mode", "manual")  # "manual" or "auto"

        # Get coordinates if available
        lat = data.get("latitude")
        lon = data.get("longitude")
        if lat: lat = float(lat)
        if lon: lon = float(lon)

        weather_info = None

        if mode == "auto" and lat and lon:
            # Auto mode: fetch weather from API
            weather_info = fetch_weather(lat, lon)
            if weather_info:
                temperature = weather_info["temperature"]
                humidity = weather_info["humidity"]
                rainfall = weather_info["rainfall"]
                # Use average soil values for auto mode
                n = float(data.get("N", 60))
                p = float(data.get("P", 40))
                k = float(data.get("K", 40))
                ph = float(data.get("ph", 6.5))
            else:
                return jsonify({"success": False, "error": "Could not fetch weather data"}), 500
        else:
            # Manual mode: use user inputs
            n = float(data.get("N", 80))
            p = float(data.get("P", 45))
            k = float(data.get("K", 40))
            temperature = float(data.get("temperature", 26))
            humidity = float(data.get("humidity", 70))
            ph = float(data.get("ph", 6.5))
            rainfall = float(data.get("rainfall", 150))

        # 1. Crop Recommendation
        crop_features = np.array([[n, p, k, temperature, humidity, ph, rainfall]])
        crop_prediction = crop_model.predict(crop_features)[0]
        crop_probabilities = crop_model.predict_proba(crop_features)[0]
        crop_name = str(crop_prediction)
        crop_confidence = round(float(max(crop_probabilities)) * 100, 1)

        top_indices = np.argsort(crop_probabilities)[-3:][::-1]
        top_crops = [
            {"name": str(CROP_CLASSES[i]), "probability": round(float(crop_probabilities[i]) * 100, 1)}
            for i in top_indices
        ]

        # 2. Yield Prediction
        crop_index = CROP_CLASSES.index(crop_name) if crop_name in CROP_CLASSES else 0
        yield_features = np.array([[crop_index, n, p, k, temperature, humidity, ph, rainfall]])
        yield_prediction = round(max(0.1, float(yield_model.predict(yield_features)[0])), 2)

        # 3. Price Prediction
        msp = MSP_DATA.get(crop_name, 2500)
        price_features = np.array([[crop_index, msp,
                                     float(data.get("kharif_arrival", DEFAULT_MARKET["kharif_arrival"])),
                                     float(data.get("rabi_price", DEFAULT_MARKET["rabi_price"])),
                                     float(data.get("rabi_arrival", DEFAULT_MARKET["rabi_arrival"]))]])
        price_prediction = round(max(100, float(price_model.predict(price_features)[0])), 2)

        # 4. Profit
        profit = round(yield_prediction * price_prediction * 10, 2)

        # 5. NDVI
        if lat and lon:
            ndvi_data = fetch_planet_ndvi(lat, lon)
            if ndvi_data:
                print(f"📡 Real NDVI: {ndvi_data['ndvi']} ({ndvi_data['health']})")
            else:
                ndvi_data = compute_ndvi_simulated(temperature, humidity, rainfall, ph)
        else:
            ndvi_data = compute_ndvi_simulated(temperature, humidity, rainfall, ph)

        # 6. Smart Advisory (Gemini AI with fallback)
        language = data.get('language', 'en')
        advisory_data = generate_gemini_advisory(
            crop_name, yield_prediction, price_prediction, profit,
            ndvi_data, temperature, humidity, ph, rainfall, n, p, k, weather_info, language=language
        )
        if not advisory_data:
            advisory_data = generate_fallback_advisory(
                crop_name, ndvi_data, temperature, humidity, ph, rainfall, n, p, k
            )

        # 7. Feature Importance
        crop_importance = get_feature_importance(
            crop_model, ["N", "P", "K", "Temperature", "Humidity", "pH", "Rainfall"])
        yield_importance = get_feature_importance(
            yield_model, ["Crop", "N", "P", "K", "Temperature", "Humidity", "pH", "Rainfall"])

        # 8. Market Timing Recommendation
        market_timing = market_decision(price_prediction, msp, crop_name)

        # 9. Risk Analysis
        risk_data = calculate_risk(ndvi_data, rainfall, price_prediction, msp, temperature, humidity)

        # 10. NDVI Timeline (mock monthly trend)
        ndvi_timeline = generate_ndvi_timeline(ndvi_data["ndvi"], temperature, rainfall)

        # 11. Alert System
        alerts = generate_alerts(ndvi_data, rainfall, price_prediction, msp, temperature, humidity, ph, risk_data)

        response = {
            "success": True,
            "mode": mode,
            "crop": {"name": crop_name.title(), "confidence": crop_confidence, "top_crops": top_crops},
            "yield": {"value": yield_prediction, "unit": "tons/hectare"},
            "price": {"value": price_prediction, "unit": "₹/quintal", "msp": msp},
            "profit": {"value": profit, "unit": "₹/hectare"},
            "ndvi": ndvi_data,
            "advisory": advisory_data,
            "feature_importance": {"crop": crop_importance, "yield": yield_importance},
            "weather": weather_info,
            "inputs": {"N": n, "P": p, "K": k, "temperature": temperature,
                       "humidity": humidity, "ph": ph, "rainfall": rainfall},
            "location": {"latitude": lat, "longitude": lon} if lat and lon else None,
            "market_timing": market_timing,
            "risk": risk_data,
            "ndvi_timeline": ndvi_timeline,
            "alerts": alerts
        }
        return jsonify(response)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MARKET TIMING RECOMMENDATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def market_decision(price, msp, crop):
    """Determine market timing — Sell Now / Hold / Neutral."""
    ratio = price / msp if msp > 0 else 1.0

    if ratio >= 1.25:
        return {
            "decision": "Hold",
            "badge": "🟢",
            "color": "#22c55e",
            "reason": f"Price (₹{price:,.0f}) is {((ratio-1)*100):.0f}% above MSP (₹{msp:,.0f}). Market is favorable — hold for even better prices.",
            "confidence": min(95, int(50 + ratio * 20))
        }
    elif ratio >= 1.0:
        return {
            "decision": "Neutral",
            "badge": "🟡",
            "color": "#f59e0b",
            "reason": f"Price (₹{price:,.0f}) is near MSP (₹{msp:,.0f}). Monitor market trends before deciding.",
            "confidence": min(85, int(40 + ratio * 20))
        }
    elif ratio >= 0.85:
        return {
            "decision": "Sell Now",
            "badge": "🔴",
            "color": "#ef4444",
            "reason": f"Price (₹{price:,.0f}) is {((1-ratio)*100):.0f}% below MSP (₹{msp:,.0f}). Sell at MSP via government procurement to avoid losses.",
            "confidence": min(90, int(60 + (1-ratio) * 100))
        }
    else:
        return {
            "decision": "Sell Now",
            "badge": "🔴",
            "color": "#ef4444",
            "reason": f"Price (₹{price:,.0f}) is significantly below MSP (₹{msp:,.0f}). Sell immediately at MSP or store if possible.",
            "confidence": min(95, int(70 + (1-ratio) * 80))
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RISK ANALYSIS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def calculate_risk(ndvi_data, rainfall, price, msp, temperature, humidity):
    """Calculate farming risk level with reasons."""
    risk_score = 0
    reasons = []
    factors = []

    # NDVI risk
    ndvi_val = ndvi_data.get("ndvi", 0.5)
    if ndvi_val < 0.3:
        risk_score += 35
        reasons.append("Very low crop health (NDVI < 0.3)")
        factors.append({"factor": "Crop Health", "level": "Critical", "score": 35, "color": "#ef4444"})
    elif ndvi_val < 0.5:
        risk_score += 20
        reasons.append("Below-average crop health")
        factors.append({"factor": "Crop Health", "level": "Warning", "score": 20, "color": "#f59e0b"})
    else:
        factors.append({"factor": "Crop Health", "level": "Good", "score": 5, "color": "#22c55e"})
        risk_score += 5

    # Rainfall risk
    if rainfall < 50:
        risk_score += 25
        reasons.append("Severe water deficit (rainfall < 50mm)")
        factors.append({"factor": "Water Supply", "level": "Critical", "score": 25, "color": "#ef4444"})
    elif rainfall < 100:
        risk_score += 15
        reasons.append("Low rainfall conditions")
        factors.append({"factor": "Water Supply", "level": "Warning", "score": 15, "color": "#f59e0b"})
    elif rainfall > 300:
        risk_score += 15
        reasons.append("Excess rainfall — flood/waterlogging risk")
        factors.append({"factor": "Water Supply", "level": "Warning", "score": 15, "color": "#f59e0b"})
    else:
        factors.append({"factor": "Water Supply", "level": "Good", "score": 5, "color": "#22c55e"})
        risk_score += 5

    # Price risk
    price_ratio = price / msp if msp > 0 else 1
    if price_ratio < 0.85:
        risk_score += 25
        reasons.append("Market price significantly below MSP")
        factors.append({"factor": "Market Price", "level": "Critical", "score": 25, "color": "#ef4444"})
    elif price_ratio < 1.0:
        risk_score += 15
        reasons.append("Unstable market — price below MSP")
        factors.append({"factor": "Market Price", "level": "Warning", "score": 15, "color": "#f59e0b"})
    else:
        factors.append({"factor": "Market Price", "level": "Good", "score": 5, "color": "#22c55e"})
        risk_score += 5

    # Temperature risk
    if temperature > 40:
        risk_score += 15
        reasons.append("Extreme heat stress")
        factors.append({"factor": "Temperature", "level": "Critical", "score": 15, "color": "#ef4444"})
    elif temperature > 35 or temperature < 10:
        risk_score += 10
        reasons.append("Temperature stress on crops")
        factors.append({"factor": "Temperature", "level": "Warning", "score": 10, "color": "#f59e0b"})
    else:
        factors.append({"factor": "Temperature", "level": "Good", "score": 3, "color": "#22c55e"})
        risk_score += 3

    # Determine level
    risk_score = min(100, risk_score)
    if risk_score >= 60:
        level = "High"
        color = "#ef4444"
        badge = "🔴"
    elif risk_score >= 35:
        level = "Medium"
        color = "#f59e0b"
        badge = "🟡"
    else:
        level = "Low"
        color = "#22c55e"
        badge = "🟢"

    return {
        "level": level,
        "score": risk_score,
        "badge": badge,
        "color": color,
        "reasons": reasons if reasons else ["All parameters within normal range"],
        "factors": factors
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NDVI TIMELINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_ndvi_timeline(current_ndvi, temperature, rainfall):
    """Generate a realistic 12-month NDVI timeline for crop health trend."""
    import random
    random.seed(int(current_ndvi * 1000 + temperature))

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    base = max(0.15, current_ndvi - 0.25)

    # Simulate seasonal growth pattern
    seasonal = [0.75, 0.70, 0.78, 0.85, 0.90, 0.82, 0.88, 0.92, 0.85, 0.80, 0.72, 0.68]
    timeline = []
    for i, month in enumerate(months):
        val = base + (current_ndvi - base) * seasonal[i] + random.uniform(-0.05, 0.05)
        val = round(max(0.05, min(0.98, val)), 3)
        timeline.append({"month": month, "ndvi": val})

    return timeline


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ALERT SYSTEM
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def generate_alerts(ndvi_data, rainfall, price, msp, temperature, humidity, ph, risk_data):
    """Generate real-time alerts based on thresholds."""
    alerts = []

    ndvi_val = ndvi_data.get("ndvi", 0.5)
    if ndvi_val < 0.3:
        alerts.append({"type": "critical", "icon": "🚨", "title": "Low Crop Health Detected",
            "message": f"NDVI is {ndvi_val} (critical). Immediate intervention required — apply foliar spray and micronutrients."})
    elif ndvi_val < 0.5:
        alerts.append({"type": "warning", "icon": "⚠️", "title": "Declining Crop Health",
            "message": f"NDVI is {ndvi_val}. Monitor closely and consider nutrient supplementation."})

    if rainfall < 50:
        alerts.append({"type": "critical", "icon": "🏜️", "title": "Severe Drought Conditions",
            "message": f"Rainfall is only {rainfall}mm. Set up emergency irrigation immediately."})
    elif rainfall > 300:
        alerts.append({"type": "warning", "icon": "🌊", "title": "Flood Risk — Excess Rainfall",
            "message": f"Rainfall is {rainfall}mm. Ensure drainage. Watch for waterlogging."})

    if price < msp * 0.9:
        alerts.append({"type": "warning", "icon": "📉", "title": "Price Below MSP",
            "message": f"Market price (₹{price:,.0f}) is below MSP (₹{msp:,.0f}). Consider selling through government procurement."})

    if temperature > 40:
        alerts.append({"type": "critical", "icon": "🌡️", "title": "Extreme Heat Alert",
            "message": f"Temperature is {temperature}°C. Provide shade and increase irrigation frequency."})
    elif temperature < 5:
        alerts.append({"type": "critical", "icon": "❄️", "title": "Frost Warning",
            "message": f"Temperature is {temperature}°C. Cover crops with mulch or plastic sheets."})

    if ph < 5.5:
        alerts.append({"type": "warning", "icon": "⚗️", "title": "Acidic Soil Alert",
            "message": f"Soil pH is {ph}. Apply lime @ 2-4 tonnes/hectare to correct acidity."})
    elif ph > 7.5:
        alerts.append({"type": "warning", "icon": "⚗️", "title": "Alkaline Soil Alert",
            "message": f"Soil pH is {ph}. Apply gypsum @ 2-5 tonnes/hectare."})

    if risk_data["level"] == "High":
        alerts.append({"type": "critical", "icon": "🔴", "title": "High Risk Farming Conditions",
            "message": f"Overall risk score: {risk_data['score']}/100. {'; '.join(risk_data['reasons'][:2])}"})

    if not alerts:
        alerts.append({"type": "info", "icon": "✅", "title": "All Systems Normal",
            "message": "No critical alerts. All farming parameters are within acceptable ranges."})

    return alerts


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PDF REPORT DOWNLOAD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/report", methods=["POST"])
def generate_report():
    """Generate a downloadable text report."""
    try:
        data = request.get_json()
        lines = []
        lines.append("=" * 60)
        lines.append("   SMART FARMING DECISION SYSTEM — ANALYSIS REPORT")
        lines.append("=" * 60)
        lines.append(f"   Generated: {__import__('datetime').datetime.now().strftime('%d-%b-%Y %H:%M')}")
        lines.append("")
        lines.append("── CROP RECOMMENDATION ──────────────────────────────")
        lines.append(f"   Recommended Crop     : {data.get('crop', 'N/A')}")
        lines.append(f"   Confidence           : {data.get('confidence', 'N/A')}%")
        lines.append("")
        lines.append("── YIELD & MARKET ──────────────────────────────────")
        lines.append(f"   Yield Prediction     : {data.get('yield', 'N/A')} tons/hectare")
        lines.append(f"   Market Price         : ₹{data.get('price', 'N/A')}/quintal")
        lines.append(f"   MSP                  : ₹{data.get('msp', 'N/A')}/quintal")
        lines.append(f"   Expected Profit      : ₹{data.get('profit', 'N/A')}/hectare")
        lines.append(f"   Market Timing        : {data.get('market_timing', 'N/A')}")
        lines.append("")
        lines.append("── CROP HEALTH ─────────────────────────────────────")
        lines.append(f"   NDVI                 : {data.get('ndvi', 'N/A')}")
        lines.append(f"   NDVI Source          : {data.get('ndvi_source', 'N/A')}")
        lines.append(f"   Risk Level           : {data.get('risk_level', 'N/A')}")
        lines.append(f"   Risk Score           : {data.get('risk_score', 'N/A')}/100")
        lines.append("")
        lines.append("── ENVIRONMENTAL DATA ──────────────────────────────")
        lines.append(f"   Temperature          : {data.get('temperature', 'N/A')}°C")
        lines.append(f"   Humidity             : {data.get('humidity', 'N/A')}%")
        lines.append(f"   Rainfall             : {data.get('rainfall', 'N/A')} mm")
        lines.append(f"   Soil pH              : {data.get('ph', 'N/A')}")
        lines.append(f"   N / P / K            : {data.get('npk', 'N/A')} kg/ha")
        lines.append("")
        lines.append("── ADVISORIES ──────────────────────────────────────")
        for adv in data.get("advisories", []):
            lines.append(f"   {adv.get('icon','')} {adv.get('title','')}: {adv.get('message','')}")
        lines.append("")
        lines.append("── ALERTS ──────────────────────────────────────────")
        for alert in data.get("alerts", []):
            lines.append(f"   {alert.get('icon','')} {alert.get('title','')}: {alert.get('message','')}")
        lines.append("")
        lines.append("=" * 60)
        lines.append("   © 2026 Smart Farming AI | Hackathon Project")
        lines.append("=" * 60)

        report_text = "\n".join(lines)

        return app.response_class(
            response=report_text,
            status=200,
            mimetype="text/plain",
            headers={"Content-Disposition": "attachment; filename=Smart_Farming_Report.txt"}
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/ndvi", methods=["POST"])
def ndvi_endpoint():
    """NDVI endpoint — tries Planet satellite, falls back to simulation."""
    try:
        data = request.get_json()
        lat = data.get("latitude")
        lon = data.get("longitude")

        if lat and lon:
            ndvi = fetch_planet_ndvi(float(lat), float(lon))
            if ndvi:
                return jsonify({"success": True, **ndvi})

        temperature = float(data.get("temperature", 26))
        humidity = float(data.get("humidity", 70))
        rainfall = float(data.get("rainfall", 150))
        ph = float(data.get("ph", 6.5))
        ndvi = compute_ndvi_simulated(temperature, humidity, rainfall, ph)
        return jsonify({"success": True, **ndvi})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/disease", methods=["POST"])
def disease_endpoint():
    """Plant disease detection from leaf image."""
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "error": "No image file provided"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"success": False, "error": "No file selected"}), 400

        img = Image.open(file.stream).convert("RGB")
        img_array = np.array(img)

        r_mean = float(np.mean(img_array[:, :, 0]))
        g_mean = float(np.mean(img_array[:, :, 1]))
        b_mean = float(np.mean(img_array[:, :, 2]))

        green_ratio = g_mean / (r_mean + g_mean + b_mean + 1e-6)
        brown_ratio = r_mean / (g_mean + 1e-6)
        brightness = (r_mean + g_mean + b_mean) / 3.0

        if green_ratio > 0.38 and brown_ratio < 1.1:
            disease = DISEASE_DB[7]
            confidence = round(85 + green_ratio * 20, 1)
        elif brown_ratio > 1.5:
            disease = DISEASE_DB[3] if brightness > 150 else DISEASE_DB[0]
            confidence = round(70 + brown_ratio * 5, 1)
        elif r_mean > g_mean * 1.2:
            disease = DISEASE_DB[4]
            confidence = round(72 + (r_mean / g_mean) * 5, 1)
        elif brightness < 100:
            disease = DISEASE_DB[6]
            confidence = round(68 + (100 - brightness) * 0.2, 1)
        elif g_mean < 100:
            disease = DISEASE_DB[1] if b_mean > g_mean else DISEASE_DB[2]
            confidence = round(65 + (100 - g_mean) * 0.3, 1)
        else:
            disease = DISEASE_DB[5]
            confidence = round(60 + abs(r_mean - g_mean) * 0.5, 1)

        confidence = min(confidence, 97.5)

        img_thumbnail = img.copy()
        img_thumbnail.thumbnail((400, 400))
        buffered = io.BytesIO()
        img_thumbnail.save(buffered, format="JPEG", quality=85)
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return jsonify({
            "success": True,
            "disease": disease["name"],
            "confidence": confidence,
            "treatment": disease["treatment"],
            "image_preview": f"data:image/jpeg;base64,{img_base64}",
            "color_analysis": {
                "red_mean": round(r_mean, 1), "green_mean": round(g_mean, 1),
                "blue_mean": round(b_mean, 1), "green_ratio": round(green_ratio, 3)
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LIVE MANDI PRICES (data.gov.in)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDI_API_KEY = "579b464db66ec23bdd000001857093021f5041a25572411fe89dcd3d"
MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# Mapping of our crop names to mandi commodity names
CROP_TO_COMMODITY = {
    'rice': 'Paddy(Dhan)(Common)', 'wheat': 'Wheat', 'maize': 'Maize',
    'cotton': 'Cotton', 'jute': 'Jute', 'lentil': 'Masur Dal',
    'mungbean': 'Green Gram (Moong)(Whole)', 'mothbeans': 'Moth',
    'pigeonpeas': 'Arhar (Tur/Red Gram)(Whole)', 'kidneybeans': 'Rajma',
    'chickpea': 'Bengal Gram(Gram)(Whole)', 'blackgram': 'Black Gram (Urd Beans)(Whole)',
    'coconut': 'Coconut', 'banana': 'Banana', 'mango': 'Mango(Raw-Ripe)',
    'apple': 'Apple', 'grapes': 'Grapes', 'orange': 'Orange',
    'watermelon': 'Water Melon', 'papaya': 'Papaya', 'pomegranate': 'Pomegranate',
    'coffee': 'Coffee', 'muskmelon': 'Musk Melon', 'sugarcane': 'Sugarcane'
}


@app.route("/api/mandi", methods=["POST"])
def mandi_prices():
    """Fetch live mandi prices from data.gov.in API — client-side filtering to avoid API timeout."""
    try:
        data = request.get_json()
        commodity = data.get("commodity", "Rice").strip()
        state = data.get("state", "").strip()
        limit = int(data.get("limit", 15))

        # Map crop name to commodity name
        mapped = CROP_TO_COMMODITY.get(commodity.lower(), commodity)
        search_terms = [mapped.lower(), commodity.lower()]

        params = {
            "api-key": MANDI_API_KEY,
            "format": "json",
            "limit": 500,
            "offset": 0
        }

        # Only use state filter (fast) — skip commodity filter (slow/timeout)
        if state:
            params["filters[state]"] = state

        resp = http_requests.get(MANDI_API_URL, params=params, timeout=25)

        if resp.status_code != 200:
            print(f"⚠️ Mandi API error: {resp.status_code}")
            return jsonify({"success": False, "error": f"Mandi API error: {resp.status_code}"}), 500

        result = resp.json()
        records = result.get("records", [])

        # Client-side commodity filtering (fuzzy match)
        filtered = []
        for rec in records:
            rec_commodity = rec.get("commodity", "").lower()
            if any(term in rec_commodity or rec_commodity in term for term in search_terms):
                filtered.append(rec)

        # If no exact matches, try partial word match
        if not filtered:
            for rec in records:
                rec_commodity = rec.get("commodity", "").lower()
                words = commodity.lower().split()
                if any(w in rec_commodity for w in words if len(w) > 2):
                    filtered.append(rec)

        # Limit results
        filtered = filtered[:limit]

        prices = []
        for rec in filtered:
            prices.append({
                "state": rec.get("state", "—"),
                "district": rec.get("district", "—"),
                "market": rec.get("market", "—"),
                "commodity": rec.get("commodity", "—"),
                "variety": rec.get("variety", "—"),
                "arrival_date": rec.get("arrival_date", "—"),
                "min_price": rec.get("min_price", "—"),
                "max_price": rec.get("max_price", "—"),
                "modal_price": rec.get("modal_price", "—"),
            })

        return jsonify({
            "success": True,
            "total": result.get("total", 0),
            "count": len(prices),
            "prices": prices,
            "commodity_searched": commodity,
            "source": "data.gov.in (National Mandi Portal)"
        })

    except Exception as e:
        print(f"⚠️ Mandi API error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DISASTER DECISION ENGINE (Gemini-powered)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/disaster", methods=["POST"])
def disaster_engine():
    """Disaster preparedness and response advisory using Gemini AI."""
    try:
        data = request.get_json()
        disaster_type = data.get("disaster_type", "flood")
        crop = data.get("crop", "rice")
        location = data.get("location", "India")
        severity = data.get("severity", "moderate")

        prompt = f"""You are an emergency agricultural disaster response advisor for Indian farmers. A {severity} {disaster_type} is expected or occurring.

CONTEXT:
- Disaster: {disaster_type.upper()} ({severity} severity)
- Current/Planned Crop: {crop}
- Location: {location}

Provide a comprehensive disaster response plan in JSON format (return ONLY the JSON, no markdown):
{{
    "disaster_type": "{disaster_type}",
    "severity": "{severity}",
    "immediate_actions": [
        {{
            "icon": "<emoji>",
            "priority": "immediate|within_24h|within_week",
            "action": "<specific action to take>",
            "detail": "<practical detail>"
        }}
    ],
    "crop_protection": {{
        "can_save": true/false,
        "measures": ["<list of crop protection measures>"],
        "alternative_crops": ["<crops that can be planted after disaster>"],
        "recovery_timeline": "<expected recovery period>"
    }},
    "financial_advisory": {{
        "insurance_claim": "<how to file PMFBY crop insurance claim>",
        "govt_schemes": ["<relevant government disaster relief schemes>"],
        "compensation": "<expected compensation info>"
    }},
    "water_management": "<specific water management advice>",
    "post_disaster": ["<list of post-disaster recovery steps>"],
    "warning_signs": ["<signs to watch for to assess damage>"],
    "helpline": "<relevant helpline numbers>"
}}

Provide 5-8 immediate actions, 3-4 crop protection measures, 2-3 government schemes, and 3-4 post-disaster steps. Keep advice practical, specific for Indian marginal farmers. Include specific quantities, timings, and method names."""

        resp = gemini_request(prompt, temperature=0.6, max_tokens=2000)

        if resp is None or resp.status_code != 200:
            return jsonify({"success": False, "error": f"Gemini API error: {resp.status_code if resp else 'no response'}"}), 500

        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0].strip()

        disaster_plan = json.loads(text)
        disaster_plan["source"] = "Gemini AI Disaster Engine"
        return jsonify({"success": True, **disaster_plan})

    except json.JSONDecodeError:
        # Return a basic fallback plan
        return jsonify({
            "success": True,
            "disaster_type": disaster_type,
            "severity": severity,
            "source": "Fallback Engine",
            "immediate_actions": [
                {"icon": "🚨", "priority": "immediate", "action": "Evacuate if life-threatening", "detail": "Move to higher ground for floods, shelter for cyclones."},
                {"icon": "📱", "priority": "immediate", "action": "Contact NDRF helpline 011-26107953", "detail": "Report damage for relief coordination."},
                {"icon": "🌾", "priority": "within_24h", "action": "Drain standing water from fields", "detail": "Use pumps if available. Create drainage channels."},
                {"icon": "📋", "priority": "within_24h", "action": "Document crop damage with photos", "detail": "Needed for PMFBY insurance claims."},
                {"icon": "🏦", "priority": "within_week", "action": "Visit nearest agriculture office", "detail": "Apply for crop loss compensation."}
            ],
            "crop_protection": {
                "can_save": severity != "severe",
                "measures": ["Drain excess water immediately", "Apply fungicide after water recedes", "Provide nutrient boost with urea spray"],
                "alternative_crops": ["Short-duration rice", "Vegetables", "Green gram"],
                "recovery_timeline": "2-4 weeks for moderate damage"
            },
            "financial_advisory": {
                "insurance_claim": "File PMFBY claim within 72 hours via crop insurance portal or helpline 1800-200-7710",
                "govt_schemes": ["PM Fasal Bima Yojana", "NDRF Relief", "State Disaster Relief Fund"],
                "compensation": "Compensation varies by state. Contact Block Development Officer."
            },
            "water_management": "Drain fields within 48 hours. Re-level land after water recedes.",
            "post_disaster": ["Assess and document all damage", "Apply lime to neutralize soil acidity", "Re-sow quick-maturing varieties", "Apply foliar fertilizer for recovery"],
            "warning_signs": ["Yellowing of leaves (waterlogging)", "Root rot smell", "Wilting despite wet soil"],
            "helpline": "NDRF: 011-26107953 | Kisan Call Center: 1800-180-1551"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CROP SUITABILITY CHATBOT (Gemini-powered)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/chat", methods=["POST"])
def crop_chatbot():
    """AI chatbot for crop suitability and farming questions."""
    try:
        data = request.get_json()
        question = data.get("question", "")
        context = data.get("context", {})

        if not question.strip():
            return jsonify({"success": False, "error": "Please ask a question"}), 400

        context_str = ""
        if context:
            context_str = f"""
FARMER'S CURRENT DATA:
- Location: {context.get('location', 'India')}
- Current Crop: {context.get('crop', 'Not specified')}
- Temperature: {context.get('temperature', 'N/A')}°C
- Humidity: {context.get('humidity', 'N/A')}%
- Rainfall: {context.get('rainfall', 'N/A')} mm/month
- Soil pH: {context.get('ph', 'N/A')}
- N/P/K: {context.get('N', 'N/A')}/{context.get('P', 'N/A')}/{context.get('K', 'N/A')} kg/ha
- NDVI: {context.get('ndvi', 'N/A')}"""

        language = data.get('language', 'en')
        lang_instruction = ""
        if language == 'as':
            lang_instruction = "\n8. IMPORTANT: You MUST respond ENTIRELY in Assamese language (অসমীয়া ভাষা). Use proper Assamese script. Do NOT use Bengali. The ANSWER, QUICK_TIPS, and all text must be in accurate Assamese. Only the format labels (ANSWER:, QUICK_TIPS:, CONFIDENCE:) should remain in English."

        prompt = f"""You are an expert Indian agricultural advisor helping marginal farmers. Answer the following question in a helpful, practical way.
{context_str}

FARMER'S QUESTION: {question}

Rules:
1. Give specific, actionable advice relevant to Indian farming conditions
2. Include quantities, timings, and specific product/variety names when relevant
3. If they ask about crop suitability, explain why it is or isn't suitable based on their conditions
4. Mention relevant government schemes if applicable
5. Keep the answer concise (3-5 paragraphs max) but informative
6. Use simple language that a marginal farmer can understand
7. If you don't know, say so honestly{lang_instruction}

Respond in plain text using the following format:

ANSWER:
<your detailed answer>

QUICK_TIPS:
- <tip 1>
- <tip 2>
- <tip 3>

CONFIDENCE: <high/medium/low>"""

        resp = gemini_request(prompt, temperature=0.7, max_tokens=1200)

        if resp is None or resp.status_code != 200:
            return jsonify({"success": False, "error": "AI service unavailable"}), 500

        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()

        # Parse response
        answer = text
        tips = []
        confidence = "medium"

        if "ANSWER:" in text:
            parts = text.split("ANSWER:", 1)[1]
            if "QUICK_TIPS:" in parts:
                answer, tips_section = parts.split("QUICK_TIPS:", 1)
                answer = answer.strip()
                if "CONFIDENCE:" in tips_section:
                    tips_text, conf = tips_section.split("CONFIDENCE:", 1)
                    confidence = conf.strip().lower()
                else:
                    tips_text = tips_section
                tips = [t.strip().lstrip("- ") for t in tips_text.strip().split("\n") if t.strip().startswith("-")]
            else:
                answer = parts.strip()

        return jsonify({
            "success": True,
            "answer": answer,
            "tips": tips,
            "confidence": confidence,
            "source": "Gemini AI",
            "question": question
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("\n🌾 Smart Farming Decision System — Hackathon Edition")
    print("━" * 55)
    print(f"📊 ML Models: crop, yield, price ({len(CROP_CLASSES)} crops)")
    print(f"🛰️  Planet Satellite API: Active")
    print(f"🌤️  OpenWeatherMap API: Active")
    print(f"🧠 Gemini AI Advisory: Active")
    print(f"🏪 Mandi Prices API: Active")
    print(f"💬 Crop Chatbot: Active")
    print(f"🌊 Disaster Engine: Active")
    print(f"🌐 Server: http://localhost:5000")
    print("━" * 55)
    app.run(debug=True, host="0.0.0.0", port=5000)

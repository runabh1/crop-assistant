/**
 * Smart Farming Decision System — Frontend JS
 * GPS + Weather + Satellite + Gemini AI + ML Models
 */

// ━━━ STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let currentMode = 'auto';
let userLocation = null;
let currentCharts = {};
let diseaseFile = null;
let lastPredictionData = null;
let currentLang = localStorage.getItem('lang') || 'en';
let isRecording = false;
let speechRecognition = null;

// ━━━ ASSAMESE TRANSLATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const i18n = {
    // Header
    'app_title': { en: 'Smart Farming', as: 'স্মাৰ্ট কৃষি' },
    'app_subtitle': { en: 'AI Decision System for Marginal Farmers', as: 'ক্ষুদ্ৰ কৃষকৰ বাবে AI সিদ্ধান্ত ব্যৱস্থা' },
    'live': { en: 'Live', as: 'লাইভ' },
    'ml_models': { en: 'ML Models', as: 'ML মডেল' },
    'satellite': { en: 'Satellite', as: 'উপগ্ৰহ' },
    'weather': { en: 'Weather', as: 'বতৰ' },
    'gemini_ai': { en: 'Gemini AI', as: 'জেমিনি AI' },
    // Mode tabs
    'smart_mode': { en: 'Smart Mode', as: 'স্মাৰ্ট ম\'ড' },
    'smart_mode_desc': { en: 'GPS + Weather + Satellite', as: 'GPS + বতৰ + উপগ্ৰহ' },
    'sensor_mode': { en: 'Sensor Mode', as: 'চেন্সৰ ম\'ড' },
    'sensor_mode_desc': { en: 'Manual Input', as: 'হাতেৰে ভৰোৱা' },
    // Location
    'your_location': { en: '📍 Your Location', as: '📍 আপোনাৰ অৱস্থান' },
    'detect_location': { en: 'Detect My Location', as: 'মোৰ অৱস্থান ধৰা পেলাওক' },
    'detect_desc': { en: 'Uses GPS for weather & satellite data', as: 'বতৰ আৰু উপগ্ৰহ তথ্যৰ বাবে GPS ব্যৱহাৰ কৰে' },
    'detecting': { en: 'Detecting location...', as: 'অৱস্থান ধৰা পেলাই আছে...' },
    'location_detected': { en: 'Location Detected ✓', as: 'অৱস্থান পোৱা গ\'ল ✓' },
    'redetect': { en: 'Click to re-detect', as: 'পুনৰ ধৰা পেলাবলৈ ক্লিক কৰক' },
    'location_denied': { en: 'Location access denied', as: 'অৱস্থান অনুমতি অস্বীকাৰ' },
    'enable_gps': { en: 'Enable GPS and try again', as: 'GPS সক্ৰিয় কৰক আৰু পুনৰ চেষ্টা কৰক' },
    // Soil
    'soil_data': { en: '🧪 Soil Data (Sensor / Estimated)', as: '🧪 মাটিৰ তথ্য (চেন্সৰ / আনুমানিক)' },
    'soil_hint': { en: 'Enter if you have soil test data, or leave defaults', as: 'মাটি পৰীক্ষাৰ তথ্য থাকিলে ভৰাওক, নাইবা ডিফল্ট ৰাখক' },
    'soil_nutrients': { en: '🧪 Soil Nutrients', as: '🧪 মাটিৰ পুষ্টি' },
    'weather_soil': { en: '☁️ Weather & Soil', as: '☁️ বতৰ আৰু মাটি' },
    'nitrogen': { en: 'Nitrogen (N)', as: 'নাইট্ৰ\'জেন (N)' },
    'phosphorus': { en: 'Phosphorus (P)', as: 'ফচফৰাচ (P)' },
    'potassium': { en: 'Potassium (K)', as: 'পটাছিয়াম (K)' },
    'soil_ph': { en: 'Soil pH', as: 'মাটিৰ pH' },
    'temperature': { en: 'Temperature', as: 'তাপমাত্ৰা' },
    'humidity': { en: 'Humidity', as: 'আৰ্দ্ৰতা' },
    'rainfall': { en: 'Rainfall', as: 'বৰষুণ' },
    // Button
    'analyze_predict': { en: 'Analyze & Predict', as: 'বিশ্লেষণ আৰু পূৰ্বানুমান' },
    // Welcome
    'welcome_title': { en: 'AI-Based Crop Recommendation & Advisory', as: 'AI ভিত্তিক শস্য পৰামৰ্শ আৰু উপদেশ' },
    'welcome_desc': { en: 'Empowering marginal farmers with satellite imagery, real-time weather, soil sensor integration, and AI-driven advisory services.', as: 'উপগ্ৰহ চিত্ৰ, তাৎক্ষণিক বতৰ, মাটি চেন্সৰ সংহতি, আৰু AI চালিত উপদেশ সেৱাৰে ক্ষুদ্ৰ কৃষকক সৱলীকৰণ।' },
    'welcome_cta': { en: '👆 Select <strong>Smart Mode</strong> and click <strong>Detect My Location</strong> to start, or use <strong>Sensor Mode</strong> for manual input.', as: '👆 <strong>স্মাৰ্ট ম\'ড</strong> বাছক আৰু আৰম্ভ কৰিবলৈ <strong>অৱস্থান ধৰা পেলাওক</strong> ক্লিক কৰক, বা <strong>চেন্সৰ ম\'ড</strong> ব্যৱহাৰ কৰক।' },
    'planet_satellite': { en: 'Planet Satellite', as: 'প্লেনেট উপগ্ৰহ' },
    'live_weather': { en: 'Live Weather', as: 'লাইভ বতৰ' },
    'crop_ai': { en: 'Crop AI', as: 'শস্য AI' },
    'yield_price': { en: 'Yield & Price', as: 'উৎপাদন আৰু মূল্য' },
    'disease_ai': { en: 'Disease AI', as: 'ৰোগ AI' },
    'gemini_advisory': { en: 'Gemini Advisory', as: 'জেমিনি উপদেশ' },
    // Result cards
    'recommended_crop': { en: 'Recommended Crop', as: 'পৰামৰ্শিত শস্য' },
    'yield_prediction': { en: 'Yield Prediction', as: 'উৎপাদন পূৰ্বানুমান' },
    'market_price': { en: 'Market Price', as: 'বজাৰ মূল্য' },
    'expected_profit': { en: 'Expected Profit', as: 'আশানুৰূপ লাভ' },
    'market_timing': { en: 'Market Timing', as: 'বজাৰ সময়' },
    'risk_level': { en: 'Risk Level', as: 'বিপদৰ স্তৰ' },
    'confidence': { en: 'Confidence', as: 'বিশ্বাসযোগ্যতা' },
    // Sections
    'risk_analysis': { en: '⚡ Risk Analysis', as: '⚡ বিপদ বিশ্লেষণ' },
    'ndvi_timeline': { en: '📈 NDVI Crop Health Timeline', as: '📈 NDVI শস্য স্বাস্থ্য সময়ৰেখা' },
    'ndvi_satellite': { en: '📡 NDVI Satellite Crop Health', as: '📡 NDVI উপগ্ৰহ শস্য স্বাস্থ্য' },
    'disease_detection': { en: '🌿 Plant Disease Detection', as: '🌿 উদ্ভিদ ৰোগ চিনাক্তকৰণ' },
    'analytics': { en: '📊 Analytics & Visualizations', as: '📊 বিশ্লেষণ আৰু দৃশ্যায়ন' },
    'smart_advisory': { en: '🧠 Smart Advisory', as: '🧠 স্মাৰ্ট উপদেশ' },
    'mandi_prices': { en: '🏪 Live Mandi Prices', as: '🏪 লাইভ মাণ্ডিৰ মূল্য' },
    'disaster_engine': { en: '🌊 Disaster Decision Engine', as: '🌊 দুৰ্যোগ সিদ্ধান্ত ইঞ্জিন' },
    'ask_farming_ai': { en: '💬 Ask Farming AI', as: '💬 কৃষি AI ক সুধক' },
    'complete_report': { en: '📄 Complete Report', as: '📄 সম্পূৰ্ণ প্ৰতিবেদন' },
    // Chatbot
    'chat_welcome': { en: 'Hi! I\'m your AI farming advisor. Ask me anything about crop suitability, farming techniques, soil management, or government schemes. For example:', as: 'নমস্কাৰ! মই আপোনাৰ AI কৃষি উপদেষ্টা। শস্যৰ উপযুক্ততা, কৃষি কৌশল, মাটি ব্যৱস্থাপনা, বা চৰকাৰী আঁচনিৰ বিষয়ে যিকোনো কথা সুধিব পাৰে। উদাহৰণ:' },
    'chat_ex1': { en: '"Is sugarcane suitable for my area?"', as: '"মোৰ অঞ্চলৰ বাবে কুঁহিয়াৰ উপযুক্ত নে?"' },
    'chat_ex2': { en: '"What fertilizer schedule for rice?"', as: '"ধানৰ বাবে সাৰৰ সময়সূচী কি?"' },
    'chat_ex3': { en: '"Best crop for sandy soil with low rainfall?"', as: '"কম বৰষুণ আৰু বালিচহীয়া মাটিত কি শস্য ভাল?"' },
    'chat_placeholder': { en: 'Ask about crop suitability, techniques, schemes...', as: 'শস্যৰ উপযুক্ততা, কৌশল, আঁচনিৰ বিষয়ে সুধক...' },
    // Disease
    'drop_leaf': { en: 'Drop leaf image or <strong>click to upload</strong>', as: 'পাতৰ ছবি দিয়ক বা <strong>আপল\'ড কৰিবলৈ ক্লিক কৰক</strong>' },
    'detect_disease': { en: '🔬 Detect Disease', as: '🔬 ৰোগ চিনাক্ত কৰক' },
    'treatment': { en: '💊 Treatment', as: '💊 চিকিৎসা' },
    // Mandi
    'commodity_placeholder': { en: 'Commodity (e.g. Rice, Wheat)', as: 'শস্য (যেনে ধান, গম)' },
    'state_placeholder': { en: 'State (optional)', as: 'ৰাজ্য (ঐচ্ছিক)' },
    'fetch_prices': { en: '🔍 Fetch Prices', as: '🔍 মূল্য আনক' },
    'mandi_hint': { en: 'Enter a commodity name and click Fetch to see live mandi prices across India', as: 'শস্যৰ নাম লিখক আৰু ভাৰতৰ মাণ্ডিৰ মূল্য চাবলৈ Fetch ক্লিক কৰক' },
    // Disaster
    'generate_plan': { en: '⚡ Generate Response Plan', as: '⚡ সঁহাৰি পৰিকল্পনা তৈয়াৰ কৰক' },
    // Buttons
    'download': { en: '📥 Download', as: '📥 ডাউনল\'ড' },
    'print': { en: '🖨️ Print', as: '🖨️ প্ৰিণ্ট' },
    'live_data': { en: '🛰️ Live Data', as: '🛰️ লাইভ তথ্য' },
    '12_months': { en: '12 Months', as: '১২ মাহ' },
    // Read aloud
    'read_aloud': { en: '🔊 Read Aloud', as: '🔊 পঢ়ি শুনাওক' },
    'stop_reading': { en: '⏹ Stop', as: '⏹ বন্ধ কৰক' },
    // Footer
    'footer': { en: '🌾 Smart Farming Decision System © 2026 | AI + Satellite + Weather + Sensors | Hackathon Project', as: '🌾 স্মাৰ্ট কৃষি সিদ্ধান্ত ব্যৱস্থা © ২০২৬ | AI + উপগ্ৰহ + বতৰ + চেন্সৰ | হেকাথন প্ৰকল্প' },
    // Voice
    'speak_now': { en: '🎤 Listening... speak now', as: '🎤 শুনি আছোঁ... এতিয়া কওক' },
    'voice_not_supported': { en: 'Voice input not supported in this browser', as: 'এই ব্ৰাউজাৰত ভইচ ইনপুট সমৰ্থিত নহয়' },
};

function t(key) {
    const entry = i18n[key];
    if (!entry) return key;
    return entry[currentLang] || entry['en'] || key;
}

// ━━━ INIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
    setupModeToggle();
    setupSliderSync();
    setupThemeToggle();
    setupDiseaseUpload();
    setupForm();
    setupMandiPrices();
    setupDisasterEngine();
    setupChatbot();
    setupLanguageToggle();
    setupVoiceInput();
    applyLanguage();
});

// ━━━ MODE TOGGLING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupModeToggle() {
    document.getElementById('tabAuto').addEventListener('click', () => switchMode('auto'));
    document.getElementById('tabManual').addEventListener('click', () => switchMode('manual'));
    document.getElementById('getLocationBtn').addEventListener('click', detectLocation);
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(mode === 'auto' ? 'tabAuto' : 'tabManual').classList.add('active');
    document.getElementById('autoSection').classList.toggle('hidden', mode !== 'auto');
    document.getElementById('manualSection').classList.toggle('hidden', mode !== 'manual');
}

// ━━━ GPS LOCATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function detectLocation() {
    const btn = document.getElementById('getLocationBtn');
    const infoEl = document.getElementById('locationInfo');
    const badgeEl = document.getElementById('locBadge');
    const coordsEl = document.getElementById('locCoords');

    btn.querySelector('strong').textContent = t('detecting');
    btn.classList.remove('located');

    if (!navigator.geolocation) {
        btn.querySelector('strong').textContent = 'Geolocation not supported';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            btn.classList.add('located');
            btn.querySelector('strong').textContent = t('location_detected');
            btn.querySelector('small').textContent = t('redetect');

            infoEl.classList.remove('hidden');
            coordsEl.textContent = `${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E`;
            badgeEl.textContent = '📍 Loading weather...';

            // Fetch weather
            try {
                const resp = await fetch('/api/weather', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude: userLocation.lat, longitude: userLocation.lon })
                });
                const data = await resp.json();
                if (data.success) {
                    badgeEl.textContent = `📍 ${data.city}, ${data.country}`;
                    showWeatherPreview(data);
                } else {
                    badgeEl.textContent = '📍 Location set (weather unavailable)';
                }
            } catch (e) {
                badgeEl.textContent = '📍 Location set';
            }
        },
        (err) => {
            btn.querySelector('strong').textContent = t('location_denied');
            btn.querySelector('small').textContent = t('enable_gps');
            console.error('Geolocation error:', err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function showWeatherPreview(data) {
    const el = document.getElementById('weatherPreview');
    el.classList.remove('hidden');
    document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
    document.getElementById('weatherTemp').textContent = `${data.temperature}°C`;
    document.getElementById('weatherDesc').textContent = data.description;
    document.getElementById('weatherDetails').innerHTML = `
        <div class="weather-detail-item">💧 Humidity: ${data.humidity}%</div>
        <div class="weather-detail-item">🌧️ Rain: ~${data.rainfall} mm/mo</div>
        <div class="weather-detail-item">💨 Wind: ${data.wind_speed} m/s</div>
        <div class="weather-detail-item">🔽 Pressure: ${data.pressure} hPa</div>
        <div class="weather-detail-item">☁️ Clouds: ${data.clouds}%</div>
        <div class="weather-detail-item">🌡️ Feels: ${data.feels_like}°C</div>
    `;
}

// ━━━ FORM SUBMISSION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupForm() {
    document.getElementById('sensorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await runPrediction();
    });
}

async function runPrediction() {
    const btn = document.getElementById('predictBtn');
    btn.classList.add('loading');

    let payload;
    if (currentMode === 'auto') {
        if (!userLocation) {
            alert('Please detect your location first!');
            btn.classList.remove('loading');
            return;
        }
        payload = {
            mode: 'auto',
            latitude: userLocation.lat,
            longitude: userLocation.lon,
            N: parseFloat(document.getElementById('autoN').value),
            P: parseFloat(document.getElementById('autoP').value),
            K: parseFloat(document.getElementById('autoK').value),
            ph: parseFloat(document.getElementById('autoPH').value)
        };
    } else {
        payload = {
            mode: 'manual',
            N: parseFloat(document.getElementById('inputN').value),
            P: parseFloat(document.getElementById('inputP').value),
            K: parseFloat(document.getElementById('inputK').value),
            temperature: parseFloat(document.getElementById('inputTemp').value),
            humidity: parseFloat(document.getElementById('inputHumidity').value),
            ph: parseFloat(document.getElementById('inputPH').value),
            rainfall: parseFloat(document.getElementById('inputRainfall').value)
        };
    }

    try {
        const resp = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, language: currentLang })
        });
        const data = await resp.json();

        if (data.success) {
            document.getElementById('welcomeState').classList.add('hidden');
            document.getElementById('resultsState').classList.remove('hidden');
            displayResults(data);
        } else {
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Network error. Is the server running?');
        console.error(e);
    } finally {
        btn.classList.remove('loading');
    }
}

// ━━━ DISPLAY RESULTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayResults(data) {
    // Weather banner
    if (data.weather) {
        const banner = document.getElementById('weatherBanner');
        banner.classList.remove('hidden');
        document.getElementById('bannerCity').textContent = `${data.weather.city}, ${data.weather.country}`;
        document.getElementById('bannerWeatherIcon').src = `https://openweathermap.org/img/wn/${data.weather.icon}.png`;
        document.getElementById('bannerTemp').textContent = `${data.weather.temperature}°C`;
        document.getElementById('bannerDesc').textContent = data.weather.description;
        document.getElementById('bannerHumidity').textContent = `${data.weather.humidity}%`;
        document.getElementById('bannerRainfall').textContent = `~${data.weather.rainfall} mm`;
        document.getElementById('bannerWind').textContent = `${data.weather.wind_speed} m/s`;
    } else {
        document.getElementById('weatherBanner').classList.add('hidden');
    }

    // Cards
    displayCards(data);
    // Alerts
    displayAlerts(data.alerts);
    // Market Timing & Risk
    displayMarketTiming(data.market_timing);
    displayRisk(data.risk);
    // NDVI Timeline
    displayNDVITimeline(data.ndvi_timeline);
    // NDVI
    displayNDVI(data.ndvi);
    // Charts
    displayCharts(data);
    // Advisory
    displayAdvisory(data.advisory);
    // Auto-fill mandi with recommended crop
    if (data.crop?.name) {
        document.getElementById('mandiCommodity').value = data.crop.name;
        document.getElementById('disasterLocation').value = data.weather?.city || '';
    }
    // Store for context
    lastPredictionData = data;
    // Report
    displayReport(data);
}

function displayCards(data) {
    document.getElementById('cropValue').textContent = data.crop.name;
    document.getElementById('cropConfidence').textContent = `Confidence: ${data.crop.confidence}%`;
    const topCropsHTML = data.crop.top_crops.map(c =>
        `<div class="top-crop-item"><span>${c.name}</span><span style="font-family:var(--font-mono)">${c.probability}%</span></div>`
    ).join('');
    document.getElementById('topCrops').innerHTML = topCropsHTML;

    document.getElementById('yieldValue').textContent = `${data.yield.value} t/ha`;
    document.getElementById('priceValue').textContent = `₹${data.price.value.toLocaleString()}`;
    document.getElementById('mspInfo').innerHTML = `MSP: ₹${data.price.msp.toLocaleString()}/q`;
    document.getElementById('profitValue').textContent = `₹${data.profit.value.toLocaleString()}`;
}

// ━━━ MARKET TIMING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayMarketTiming(mt) {
    if (!mt) return;
    const el = document.getElementById('marketDecision');
    el.textContent = `${mt.badge} ${mt.decision}`;
    el.style.color = mt.color;
    document.getElementById('marketReason').textContent = mt.reason;
}

// ━━━ RISK ANALYSIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayRisk(risk) {
    if (!risk) return;
    const el = document.getElementById('riskLevel');
    el.textContent = `${risk.badge} ${risk.level}`;
    el.style.color = risk.color;
    document.getElementById('riskScore').textContent = `Risk Score: ${risk.score}/100`;
    document.getElementById('riskReasons').innerHTML = risk.reasons.map(r => `<div style="margin:2px 0;">${r}</div>`).join('');

    // Risk factors breakdown
    const factorsEl = document.getElementById('riskFactors');
    factorsEl.innerHTML = risk.factors.map(f => `
        <div class="risk-factor-item">
            <div style="flex:1;">
                <div class="risk-factor-name">${f.factor}</div>
                <div class="risk-factor-bar"><div class="risk-factor-fill" style="width:${f.score}%;background:${f.color}"></div></div>
            </div>
            <span class="risk-factor-level" style="background:${f.color}">${f.level}</span>
        </div>
    `).join('');
}

// ━━━ ALERTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayAlerts(alerts) {
    if (!alerts || alerts.length === 0) return;
    const el = document.getElementById('alertsSection');
    el.innerHTML = alerts.map((a, i) => `
        <div class="alert-banner ${a.type}" style="animation-delay:${i * 0.1}s">
            <span class="alert-icon">${a.icon}</span>
            <div class="alert-content">
                <div class="alert-title">${a.title}</div>
                <div class="alert-message">${a.message}</div>
            </div>
        </div>
    `).join('');
}

// ━━━ NDVI TIMELINE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayNDVITimeline(timeline) {
    if (!timeline || timeline.length === 0) return;
    if (currentCharts.ndviTimeline) currentCharts.ndviTimeline.destroy();

    const fontColor = getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#8899b0';
    const gridColor = 'rgba(100,120,150,.1)';

    currentCharts.ndviTimeline = new Chart(document.getElementById('ndviTimelineChart'), {
        type: 'line',
        data: {
            labels: timeline.map(t => t.month),
            datasets: [{
                label: 'NDVI Value',
                data: timeline.map(t => t.ndvi),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#22c55e',
                pointRadius: 4,
                pointHoverRadius: 7,
                borderWidth: 2.5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: fontColor, font: { family: 'Inter', size: 11 } } }
            },
            scales: {
                y: { min: 0, max: 1, ticks: { color: fontColor, font: { size: 10 } }, grid: { color: gridColor } },
                x: { ticks: { color: fontColor, font: { size: 10 } }, grid: { color: gridColor } }
            }
        }
    });
}

// ━━━ NDVI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayNDVI(ndviData) {
    document.getElementById('ndviNumber').textContent = ndviData.ndvi;
    document.getElementById('ndviNumber').style.color = ndviData.color;
    document.getElementById('ndviLabel').textContent = ndviData.health;
    document.getElementById('ndviLabel').style.color = ndviData.color;

    drawNDVIGauge(ndviData.ndvi, ndviData.color);

    const isReal = ndviData.source && ndviData.source.includes('Planet');
    const badge = document.getElementById('ndviSourceBadge');
    badge.textContent = isReal ? '🛰️ Live Satellite' : '📊 Simulated';
    badge.style.background = isReal ? 'rgba(34,197,94,.12)' : 'rgba(245,158,11,.12)';
    badge.style.color = isReal ? '#22c55e' : '#f59e0b';
    badge.style.borderColor = isReal ? 'rgba(34,197,94,.25)' : 'rgba(245,158,11,.25)';

    const satInfo = document.getElementById('ndviSatelliteInfo');
    if (isReal && ndviData.satellite_info) {
        const si = ndviData.satellite_info;
        const acq = si.acquired ? new Date(si.acquired).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) : '—';
        satInfo.innerHTML = `<div style="padding:10px;background:var(--bg-input);border-radius:8px;margin-bottom:10px;border:1px solid rgba(34,197,94,.15);">
            <div style="font-size:.7rem;font-weight:600;color:#22c55e;margin-bottom:6px;">🛰️ Planet Satellite Data</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:.68rem;">
                <div><span style="color:var(--text-muted);">Scene:</span> <span style="font-family:var(--font-mono);">${si.scene_id.substring(0,16)}…</span></div>
                <div><span style="color:var(--text-muted);">Date:</span> ${acq}</div>
                <div><span style="color:var(--text-muted);">Cloud:</span> ${si.cloud_cover}%</div>
                <div><span style="color:var(--text-muted);">Visible:</span> ${si.visible_percent}%</div>
            </div></div>`;
        satInfo.classList.remove('hidden');
    } else {
        satInfo.classList.add('hidden');
    }

    const factors = ndviData.details;
    const factorsEl = document.getElementById('ndviFactors');
    if (isReal) {
        factorsEl.innerHTML = `
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">✨ Clear Signal</span><span class="ndvi-factor-value">${(factors.clear_signal*100).toFixed(0)}%</span></div>
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">👁️ Visibility</span><span class="ndvi-factor-value">${(factors.visibility*100).toFixed(0)}%</span></div>
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">☁️ Cloud Free</span><span class="ndvi-factor-value">${(factors.cloud_free*100).toFixed(0)}%</span></div>
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">📊 Quality</span><span class="ndvi-factor-value">${(factors.data_quality*100).toFixed(0)}%</span></div>`;
    } else {
        factorsEl.innerHTML = `
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">🌡️ Temperature</span><span class="ndvi-factor-value">${(factors.temp_contribution*100).toFixed(0)}%</span></div>
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">💧 Humidity</span><span class="ndvi-factor-value">${(factors.humidity_contribution*100).toFixed(0)}%</span></div>
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">🌧️ Rainfall</span><span class="ndvi-factor-value">${(factors.rainfall_contribution*100).toFixed(0)}%</span></div>
            <div class="ndvi-factor-item"><span class="ndvi-factor-name">⚗️ pH</span><span class="ndvi-factor-value">${(factors.ph_contribution*100).toFixed(0)}%</span></div>`;
    }
}

function drawNDVIGauge(value, color) {
    const canvas = document.getElementById('ndviGauge');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2, cy = h - 20, r = 100;
    const startAngle = Math.PI, endAngle = 2 * Math.PI;

    // Background arc
    ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(100,120,150,.1)'; ctx.lineCap = 'round'; ctx.stroke();

    // Gradient segments
    const segments = [
        { start: Math.PI, end: Math.PI + Math.PI * 0.3, color: '#ef4444' },
        { start: Math.PI + Math.PI * 0.3, end: Math.PI + Math.PI * 0.6, color: '#f59e0b' },
        { start: Math.PI + Math.PI * 0.6, end: 2 * Math.PI, color: '#22c55e' }
    ];
    segments.forEach(s => {
        ctx.beginPath(); ctx.arc(cx, cy, r, s.start, s.end);
        ctx.lineWidth = 16; ctx.strokeStyle = s.color + '33'; ctx.lineCap = 'butt'; ctx.stroke();
    });

    // Value arc
    const normalizedValue = Math.max(0, Math.min(1, value));
    const valueAngle = startAngle + normalizedValue * Math.PI;
    ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, valueAngle);
    ctx.lineWidth = 16; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();

    // Needle dot
    const dotX = cx + r * Math.cos(valueAngle), dotY = cy + r * Math.sin(valueAngle);
    ctx.beginPath(); ctx.arc(dotX, dotY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.arc(dotX, dotY, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = color + '40'; ctx.lineWidth = 3; ctx.stroke();
}

// ━━━ ADVISORY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayAdvisory(advisory) {
    const isGemini = advisory.source === 'Gemini AI';
    const badge = document.getElementById('advisorySourceBadge');
    badge.textContent = isGemini ? '✨ Powered by Gemini AI' : '🔧 Rule-Based';
    badge.style.background = isGemini ? 'rgba(139,92,246,.12)' : 'rgba(245,158,11,.12)';
    badge.style.color = isGemini ? '#8b5cf6' : '#f59e0b';
    badge.style.borderColor = isGemini ? 'rgba(139,92,246,.25)' : 'rgba(245,158,11,.25)';

    if (advisory.overall_summary) {
        document.getElementById('advisorySummary').innerHTML = `<strong>📋 Summary:</strong> ${advisory.overall_summary}`;
        document.getElementById('advisorySummary').classList.remove('hidden');
    }

    const listEl = document.getElementById('advisoryList');
    listEl.innerHTML = advisory.advisories.map((a, i) => `
        <div class="advisory-item ${a.severity}" style="animation-delay:${i * 0.05}s">
            <span class="advisory-icon">${a.icon}</span>
            <div class="advisory-text">
                <div class="advisory-title">${a.title || ''}</div>
                <div class="advisory-message">${a.message}</div>
            </div>
        </div>
    `).join('');

    const extrasEl = document.getElementById('advisoryExtras');
    const extras = [];
    if (advisory.seasonal_tip) extras.push(`<div class="advisory-extra-card"><h4>🗓️ Seasonal Tip</h4><p>${advisory.seasonal_tip}</p></div>`);
    if (advisory.market_insight) extras.push(`<div class="advisory-extra-card"><h4>📈 Market Insight</h4><p>${advisory.market_insight}</p></div>`);
    extrasEl.innerHTML = extras.join('');
}

// ━━━ CHARTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayCharts(data) {
    Object.values(currentCharts).forEach(c => c.destroy());
    currentCharts = {};

    const gridColor = 'rgba(100,120,150,.1)';
    const fontColor = getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#8899b0';
    const defaults = {
        plugins: { legend: { labels: { color: fontColor, padding: 10, font: { family: 'Inter', size: 11 } } } },
        scales: { x: { ticks: { color: fontColor, font: { size: 10 } }, grid: { color: gridColor } }, y: { ticks: { color: fontColor, font: { size: 10 } }, grid: { color: gridColor } } }
    };

    // Crop probabilities
    if (data.crop.top_crops) {
        const crops = data.crop.top_crops;
        currentCharts.crop = new Chart(document.getElementById('cropChart'), {
            type: 'bar', data: {
                labels: crops.map(c => c.name),
                datasets: [{ label: 'Probability %', data: crops.map(c => c.probability),
                    backgroundColor: ['rgba(34,197,94,.6)', 'rgba(59,130,246,.5)', 'rgba(245,158,11,.4)'],
                    borderColor: ['#22c55e', '#3b82f6', '#f59e0b'], borderWidth: 1, borderRadius: 6, barPercentage: 0.6 }]
            }, options: { ...defaults, indexAxis: 'y' }
        });
    }

    // Feature importance
    if (data.feature_importance?.crop?.length) {
        const fi = data.feature_importance.crop;
        currentCharts.feature = new Chart(document.getElementById('featureChart'), {
            type: 'doughnut', data: {
                labels: fi.map(f => f.feature),
                datasets: [{ data: fi.map(f => f.importance),
                    backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'],
                    borderWidth: 0 }]
            }, options: { plugins: { legend: { position: 'bottom', labels: { color: fontColor, font: { size: 10 }, padding: 6 } } } }
        });
    }

    if (data.feature_importance?.yield?.length) {
        const yi = data.feature_importance.yield;
        currentCharts.yieldFeat = new Chart(document.getElementById('yieldFeatureChart'), {
            type: 'polarArea', data: {
                labels: yi.map(f => f.feature),
                datasets: [{ data: yi.map(f => f.importance),
                    backgroundColor: ['#22c55e44','#3b82f644','#f59e0b44','#ef444444','#8b5cf644','#06b6d444','#ec489944','#14b8a644'],
                    borderColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'],
                    borderWidth: 1 }]
            }, options: { plugins: { legend: { position: 'bottom', labels: { color: fontColor, font: { size: 10 }, padding: 6 } } } }
        });
    }

    // NDVI chart
    const ndviD = data.ndvi?.details;
    if (ndviD) {
        const isReal = data.ndvi.source?.includes('Planet');
        const labels = isReal ? ['Clear Signal','Visibility','Cloud Free','Data Quality'] : ['Temperature','Humidity','Rainfall','pH'];
        const values = isReal ? [ndviD.clear_signal, ndviD.visibility, ndviD.cloud_free, ndviD.data_quality]
                              : [ndviD.temp_contribution, ndviD.humidity_contribution, ndviD.rainfall_contribution, ndviD.ph_contribution];
        currentCharts.ndvi = new Chart(document.getElementById('ndviChart'), {
            type: 'radar', data: {
                labels,
                datasets: [{ label: 'NDVI Factors', data: values,
                    backgroundColor: 'rgba(34,197,94,.15)', borderColor: '#22c55e', pointBackgroundColor: '#22c55e', pointRadius: 4, borderWidth: 2 }]
            }, options: { scales: { r: { ticks: { color: fontColor, backdropColor: 'transparent', font: { size: 9 } }, grid: { color: gridColor }, pointLabels: { color: fontColor, font: { size: 10 } } } },
                plugins: { legend: { labels: { color: fontColor } } } }
        });
    }
}

// ━━━ REPORT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function displayReport(data) {
    const rows = [
        ['🌾', 'Recommended Crop', data.crop.name],
        ['📊', 'Confidence', `${data.crop.confidence}%`],
        ['📈', 'Yield Prediction', `${data.yield.value} ${data.yield.unit}`],
        ['💰', 'Market Price', `₹${data.price.value.toLocaleString()}/quintal`],
        ['📌', 'MSP', `₹${data.price.msp.toLocaleString()}/quintal`],
        ['🤑', 'Expected Profit', `₹${data.profit.value.toLocaleString()}/hectare`],
        ['📡', 'NDVI', `${data.ndvi.ndvi} (${data.ndvi.health})`],
        ['🛰️', 'NDVI Source', data.ndvi.source || '—'],
        ['🌡️', 'Temperature', `${data.inputs.temperature}°C`],
        ['💧', 'Humidity', `${data.inputs.humidity}%`],
        ['🌧️', 'Rainfall', `${data.inputs.rainfall} mm`],
        ['⚗️', 'Soil pH', data.inputs.ph],
        ['🧪', 'N / P / K', `${data.inputs.N} / ${data.inputs.P} / ${data.inputs.K} kg/ha`],
        ['🧠', 'Advisory Source', data.advisory?.source || '—']
    ];
    if (data.weather) {
        rows.splice(8, 0, ['🌤️', 'Weather', `${data.weather.description} (${data.weather.city})`]);
    }

    document.getElementById('reportContent').innerHTML = rows.map(([icon, label, value]) =>
        `<div class="report-row"><span class="report-icon">${icon}</span><span class="report-label">${label}</span><span class="report-value">${value}</span></div>`
    ).join('');

    document.getElementById('printReport').onclick = () => window.print();

    // Download report
    document.getElementById('downloadReport').onclick = async () => {
        try {
            const reportData = {
                crop: data.crop.name,
                confidence: data.crop.confidence,
                yield: data.yield.value,
                price: data.price.value,
                msp: data.price.msp,
                profit: data.profit.value,
                market_timing: data.market_timing?.decision || 'N/A',
                ndvi: data.ndvi.ndvi,
                ndvi_source: data.ndvi.source || 'Simulated',
                risk_level: data.risk?.level || 'N/A',
                risk_score: data.risk?.score || 'N/A',
                temperature: data.inputs.temperature,
                humidity: data.inputs.humidity,
                rainfall: data.inputs.rainfall,
                ph: data.inputs.ph,
                npk: `${data.inputs.N} / ${data.inputs.P} / ${data.inputs.K}`,
                advisories: data.advisory?.advisories || [],
                alerts: data.alerts || []
            };
            const resp = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData)
            });
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Smart_Farming_Report.txt';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download error:', e);
            alert('Failed to download report');
        }
    };
}

// ━━━ DISEASE DETECTION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupDiseaseUpload() {
    const zone = document.getElementById('uploadZone');
    const input = document.getElementById('diseaseImageInput');
    const detectBtn = document.getElementById('detectBtn');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
    input.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });

    document.getElementById('removeImage').addEventListener('click', (e) => {
        e.stopPropagation();
        diseaseFile = null;
        document.getElementById('uploadContent').classList.remove('hidden');
        document.getElementById('uploadPreview').classList.add('hidden');
        detectBtn.disabled = true;
        document.getElementById('diseaseResult').classList.add('hidden');
    });

    detectBtn.addEventListener('click', async () => {
        if (!diseaseFile) return;
        detectBtn.disabled = true;
        detectBtn.innerHTML = '<span>🔄 Analyzing...</span>';

        const formData = new FormData();
        formData.append('image', diseaseFile);

        try {
            const resp = await fetch('/api/disease', { method: 'POST', body: formData });
            const data = await resp.json();
            if (data.success) {
                const result = document.getElementById('diseaseResult');
                result.classList.remove('hidden');
                document.getElementById('diseaseIcon').textContent = data.disease === 'Healthy Leaf' ? '✅' : '🦠';
                document.getElementById('diseaseName').textContent = data.disease;
                document.getElementById('diseaseConfidence').textContent = `Confidence: ${data.confidence}%`;
                document.getElementById('treatmentText').textContent = data.treatment;
            }
        } catch(e) { console.error(e); }

        detectBtn.disabled = false;
        detectBtn.innerHTML = '<span>🔬 Detect Disease</span>';
    });
}

function handleFile(file) {
    diseaseFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('uploadContent').classList.add('hidden');
        document.getElementById('uploadPreview').classList.remove('hidden');
        document.getElementById('detectBtn').disabled = false;
    };
    reader.readAsDataURL(file);
}

// ━━━ SLIDER SYNC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupSliderSync() {
    const pairs = [['inputN','sliderN'],['inputP','sliderP'],['inputK','sliderK'],
                   ['inputTemp','sliderTemp'],['inputHumidity','sliderHumidity'],
                   ['inputPH','sliderPH'],['inputRainfall','sliderRainfall']];
    pairs.forEach(([inp, sld]) => {
        const inputEl = document.getElementById(inp);
        const sliderEl = document.getElementById(sld);
        if (!inputEl || !sliderEl) return;
        inputEl.addEventListener('input', () => { sliderEl.value = inputEl.value; });
        sliderEl.addEventListener('input', () => { inputEl.value = sliderEl.value; });
    });
}

// ━━━ THEME ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupThemeToggle() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeIcon').textContent = saved === 'dark' ? '🌙' : '☀️';

    document.getElementById('themeToggle').addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        const next = curr === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        document.getElementById('themeIcon').textContent = next === 'dark' ? '🌙' : '☀️';
    });
}

// ━━━ MANDI PRICES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupMandiPrices() {
    document.getElementById('fetchMandiBtn').addEventListener('click', fetchMandiPrices);
    document.getElementById('mandiCommodity').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') fetchMandiPrices();
    });
}

async function fetchMandiPrices() {
    const commodity = document.getElementById('mandiCommodity').value.trim();
    const state = document.getElementById('mandiState').value.trim();
    const resultsEl = document.getElementById('mandiResults');
    const btn = document.getElementById('fetchMandiBtn');

    if (!commodity) {
        resultsEl.innerHTML = '<p class="mandi-hint">⚠️ Please enter a commodity name</p>';
        return;
    }

    btn.textContent = '🔄 Loading...';
    btn.disabled = true;

    try {
        const resp = await fetch('/api/mandi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commodity, state, limit: 15 })
        });
        const data = await resp.json();

        if (data.success && data.prices.length > 0) {
            let html = `<div style="max-height:350px;overflow:auto;">
                <table class="mandi-table">
                    <thead><tr>
                        <th>State</th><th>Market</th><th>Variety</th>
                        <th>Min ₹</th><th>Max ₹</th><th>Modal ₹</th><th>Date</th>
                    </tr></thead>
                    <tbody>`;

            data.prices.forEach(p => {
                html += `<tr>
                    <td>${p.state}</td><td>${p.market}</td><td>${p.variety}</td>
                    <td class="price-cell">${Number(p.min_price).toLocaleString()}</td>
                    <td class="price-cell">${Number(p.max_price).toLocaleString()}</td>
                    <td class="modal-price">₹${Number(p.modal_price).toLocaleString()}</td>
                    <td>${p.arrival_date}</td>
                </tr>`;
            });

            html += `</tbody></table></div>
                <div class="mandi-total">
                    <span>Showing ${data.count} of ${data.total} results for "${data.commodity_searched}"</span>
                    <span class="mandi-source">Source: ${data.source}</span>
                </div>`;
            resultsEl.innerHTML = html;
        } else if (data.success) {
            resultsEl.innerHTML = '<p class="mandi-hint">No prices found for this commodity. Try a different name like "Wheat", "Paddy", "Onion".</p>';
        } else {
            resultsEl.innerHTML = `<p class="mandi-hint">⚠️ ${data.error || 'Error fetching prices'}</p>`;
        }
    } catch (e) {
        resultsEl.innerHTML = '<p class="mandi-hint">⚠️ Network error. Please try again.</p>';
    } finally {
        btn.textContent = '🔍 Fetch Prices';
        btn.disabled = false;
    }
}

// ━━━ DISASTER DECISION ENGINE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupDisasterEngine() {
    document.getElementById('runDisasterBtn').addEventListener('click', runDisasterEngine);
}

async function runDisasterEngine() {
    const disasterType = document.getElementById('disasterType').value;
    const severity = document.getElementById('disasterSeverity').value;
    const location = document.getElementById('disasterLocation').value || 'India';
    const resultsEl = document.getElementById('disasterResults');
    const btn = document.getElementById('runDisasterBtn');
    const crop = lastPredictionData?.crop?.name || 'rice';

    btn.textContent = '🔄 Generating...';
    btn.disabled = true;
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-muted);">🧠 AI is generating a disaster response plan...</p>';

    try {
        const resp = await fetch('/api/disaster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disaster_type: disasterType, severity, location, crop, language: currentLang })
        });
        const data = await resp.json();

        if (data.success) {
            renderDisasterPlan(data);
        } else {
            resultsEl.innerHTML = `<p class="mandi-hint">⚠️ ${data.error || 'Error generating plan'}</p>`;
        }
    } catch (e) {
        resultsEl.innerHTML = '<p class="mandi-hint">⚠️ Network error. Please try again.</p>';
    } finally {
        btn.textContent = '⚡ Generate Response Plan';
        btn.disabled = false;
    }
}

function renderDisasterPlan(data) {
    const el = document.getElementById('disasterResults');
    const typeIcons = { flood:'🌊', drought:'☀️', cyclone:'🌀', heatwave:'🔥', frost:'❄️', hailstorm:'🧊', pest_outbreak:'🦗' };
    const icon = typeIcons[data.disaster_type] || '⚠️';

    let html = `
        <div class="disaster-header-banner">
            <span class="dh-icon">${icon}</span>
            <div>
                <div class="dh-title">${data.disaster_type?.toUpperCase()} Response Plan</div>
                <div class="dh-subtitle">Severity: ${data.severity?.toUpperCase()} | Source: ${data.source}</div>
            </div>
        </div>
        <h4 style="font-size:.85rem;margin-bottom:8px;">🚨 Immediate Actions</h4>
        <div class="disaster-actions">`;

    if (data.immediate_actions) {
        data.immediate_actions.forEach(a => {
            html += `<div class="disaster-action ${a.priority}">
                <span class="da-icon">${a.icon}</span>
                <div class="da-content">
                    <div class="da-action">${a.action} <span class="da-priority ${a.priority}">${a.priority?.replace('_',' ')}</span></div>
                    <div class="da-detail">${a.detail}</div>
                </div>
            </div>`;
        });
    }
    html += '</div>';

    html += '<div class="disaster-grid">';

    if (data.crop_protection) {
        const cp = data.crop_protection;
        html += `<div class="disaster-card">
            <h4>🌾 Crop Protection ${cp.can_save ? '(Salvageable ✅)' : '(Likely Lost ❌)'}</h4>
            <ul>${(cp.measures||[]).map(m => `<li>${m}</li>`).join('')}</ul>
            <p style="margin-top:6px;"><strong>Alternative crops:</strong> ${(cp.alternative_crops||[]).join(', ')}</p>
            <p><strong>Recovery:</strong> ${cp.recovery_timeline || 'N/A'}</p>
        </div>`;
    }

    if (data.financial_advisory) {
        const fa = data.financial_advisory;
        html += `<div class="disaster-card">
            <h4>💰 Financial & Insurance</h4>
            <p><strong>Insurance:</strong> ${fa.insurance_claim || 'N/A'}</p>
            <ul>${(fa.govt_schemes||[]).map(s => `<li>${s}</li>`).join('')}</ul>
            <p><strong>Compensation:</strong> ${fa.compensation || 'N/A'}</p>
        </div>`;
    }

    if (data.water_management) {
        html += `<div class="disaster-card"><h4>💧 Water Management</h4><p>${data.water_management}</p></div>`;
    }

    if (data.post_disaster) {
        html += `<div class="disaster-card"><h4>🔄 Post-Disaster Recovery</h4><ul>${data.post_disaster.map(s => `<li>${s}</li>`).join('')}</ul></div>`;
    }

    html += '</div>';

    if (data.helpline) {
        html += `<div class="disaster-helpline">📞 ${data.helpline}</div>`;
    }

    el.innerHTML = html;
}

// ━━━ AI CHATBOT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupChatbot() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    sendBtn.addEventListener('click', () => sendChatMessage());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const question = input.value.trim();
    if (!question) return;

    const messages = document.getElementById('chatMessages');
    input.value = '';

    // Add user message
    messages.innerHTML += `<div class="chat-msg user"><div class="msg-avatar">👤</div><div class="msg-content"><p>${escapeHTML(question)}</p></div></div>`;

    // Typing indicator
    const typingId = 'typing-' + Date.now();
    messages.innerHTML += `<div class="chat-msg bot" id="${typingId}"><div class="msg-avatar">🧠</div><div class="msg-content"><div class="chat-typing"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div></div>`;
    messages.scrollTop = messages.scrollHeight;

    // Build context from last prediction
    const context = {};
    if (lastPredictionData) {
        context.crop = lastPredictionData.crop?.name;
        context.temperature = lastPredictionData.inputs?.temperature;
        context.humidity = lastPredictionData.inputs?.humidity;
        context.rainfall = lastPredictionData.inputs?.rainfall;
        context.ph = lastPredictionData.inputs?.ph;
        context.N = lastPredictionData.inputs?.N;
        context.P = lastPredictionData.inputs?.P;
        context.K = lastPredictionData.inputs?.K;
        context.ndvi = lastPredictionData.ndvi?.ndvi;
        context.location = lastPredictionData.weather?.city || '';
    }

    try {
        const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, context, language: currentLang })
        });
        const data = await resp.json();

        // Remove typing
        document.getElementById(typingId)?.remove();

        if (data.success) {
            const msgId = 'msg-' + Date.now();
            let botHTML = `<div class="chat-msg bot" id="${msgId}"><div class="msg-avatar">🧠</div><div class="msg-content">`;
            botHTML += `<p>${formatAnswer(data.answer)}</p>`;

            if (data.tips && data.tips.length > 0) {
                botHTML += `<div class="msg-tips"><h5>💡 ${currentLang === 'as' ? 'দ্ৰুত পৰামৰ্শ' : 'Quick Tips'}</h5><ul>${data.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
            }

            botHTML += `<div class="msg-confidence">${currentLang === 'as' ? 'বিশ্বাসযোগ্যতা' : 'Confidence'}: ${data.confidence} | ${currentLang === 'as' ? 'উৎস' : 'Source'}: ${data.source}</div>`;
            botHTML += `<button class="btn-read-aloud" onclick="readAloud(this, '${msgId}')">${t('read_aloud')}</button>`;
            botHTML += '</div></div>';
            messages.innerHTML += botHTML;
        } else {
            messages.innerHTML += `<div class="chat-msg bot"><div class="msg-avatar">🧠</div><div class="msg-content"><p>⚠️ ${data.error || 'Sorry, I could not process that.'}</p></div></div>`;
        }
    } catch (e) {
        document.getElementById(typingId)?.remove();
        messages.innerHTML += `<div class="chat-msg bot"><div class="msg-avatar">🧠</div><div class="msg-content"><p>⚠️ Network error. Please try again.</p></div></div>`;
    }

    messages.scrollTop = messages.scrollHeight;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatAnswer(text) {
    return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// ━━━ LANGUAGE TOGGLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupLanguageToggle() {
    document.getElementById('langToggle').addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'as' : 'en';
        localStorage.setItem('lang', currentLang);
        applyLanguage();
    });
}

function applyLanguage() {
    const isAs = currentLang === 'as';
    document.documentElement.setAttribute('data-lang', currentLang);

    // Toggle button
    const langBtn = document.getElementById('langToggle');
    document.getElementById('langText').textContent = isAs ? 'English' : 'অসমীয়া';
    langBtn.classList.toggle('active', isAs);

    // Header
    const h1 = document.querySelector('.logo-text h1');
    if (h1) h1.textContent = t('app_title');
    const sub = document.querySelector('.logo-subtitle');
    if (sub) sub.textContent = t('app_subtitle');

    // Header stats
    const statTexts = document.querySelectorAll('.header-stat .stat-text');
    const statKeys = ['live', 'ml_models', 'satellite', 'weather', 'gemini_ai'];
    statTexts.forEach((el, i) => { if (statKeys[i]) el.textContent = t(statKeys[i]); });

    // Mode tabs
    const tabAuto = document.getElementById('tabAuto');
    const tabManual = document.getElementById('tabManual');
    if (tabAuto) {
        tabAuto.childNodes.forEach(n => {
            if (n.nodeType === 3 && n.textContent.trim()) n.textContent = ' ' + t('smart_mode') + '\n';
        });
        const s1 = tabAuto.querySelector('small');
        if (s1) s1.textContent = t('smart_mode_desc');
    }
    if (tabManual) {
        tabManual.childNodes.forEach(n => {
            if (n.nodeType === 3 && n.textContent.trim()) n.textContent = ' ' + t('sensor_mode') + '\n';
        });
        const s2 = tabManual.querySelector('small');
        if (s2) s2.textContent = t('sensor_mode_desc');
    }

    // Location group
    const locTitle = document.querySelector('#autoSection .group-title');
    if (locTitle) locTitle.textContent = t('your_location');
    const locBtn = document.getElementById('getLocationBtn');
    if (locBtn && !locBtn.classList.contains('located')) {
        const strong = locBtn.querySelector('strong');
        if (strong) strong.textContent = t('detect_location');
        const small = locBtn.querySelector('small');
        if (small) small.textContent = t('detect_desc');
    }

    // Soil group titles
    const groupTitles = document.querySelectorAll('#autoSection .input-group .group-title');
    if (groupTitles[1]) groupTitles[1].textContent = t('soil_data');
    const groupHints = document.querySelectorAll('#autoSection .group-hint');
    if (groupHints[0]) groupHints[0].textContent = t('soil_hint');

    // Manual section titles
    const manualTitles = document.querySelectorAll('#manualSection .group-title');
    if (manualTitles[0]) manualTitles[0].textContent = t('soil_nutrients');
    if (manualTitles[1]) manualTitles[1].textContent = t('weather_soil');

    // Input labels
    const labelMap = {
        'autoN': 'nitrogen', 'autoP': 'phosphorus', 'autoK': 'potassium', 'autoPH': 'soil_ph',
        'inputN': 'nitrogen', 'inputP': 'phosphorus', 'inputK': 'potassium', 'inputPH': 'soil_ph',
        'inputTemp': 'temperature', 'inputHumidity': 'humidity', 'inputRainfall': 'rainfall'
    };
    Object.entries(labelMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) {
            const label = el.closest('.input-field')?.querySelector('label');
            if (label) label.textContent = t(key);
        }
    });

    // Predict button
    const btnText = document.querySelector('.btn-text');
    if (btnText) btnText.textContent = t('analyze_predict');

    // Welcome
    const welH2 = document.querySelector('.welcome-state h2');
    if (welH2) welH2.textContent = t('welcome_title');
    const welP = document.querySelector('.welcome-state > p');
    if (welP) welP.textContent = t('welcome_desc');
    const welCta = document.querySelector('.welcome-cta p');
    if (welCta) welCta.innerHTML = t('welcome_cta');
    const welFeatures = document.querySelectorAll('.welcome-feature p');
    const featureKeys = ['planet_satellite', 'live_weather', 'crop_ai', 'yield_price', 'disease_ai', 'gemini_advisory'];
    welFeatures.forEach((el, i) => { if (featureKeys[i]) el.textContent = t(featureKeys[i]); });

    // Result card headers
    const cardHeaders = document.querySelectorAll('.result-card .card-header h3');
    const cardKeys = ['recommended_crop', 'yield_prediction', 'market_price', 'expected_profit', 'market_timing', 'risk_level'];
    cardHeaders.forEach((el, i) => { if (cardKeys[i]) el.textContent = t(cardKeys[i]); });

    // Section headers
    const sectionMap = {
        'riskSection': 'risk_analysis', 'ndviTimelineSection': 'ndvi_timeline',
        'ndviSection': 'ndvi_satellite', 'diseaseSection': 'disease_detection',
        'chartsSection': 'analytics', 'advisorySection': 'smart_advisory',
        'mandiSection': 'mandi_prices', 'disasterSection': 'disaster_engine',
        'chatSection': 'ask_farming_ai', 'reportSection': 'complete_report'
    };
    Object.entries(sectionMap).forEach(([id, key]) => {
        const sec = document.getElementById(id);
        if (sec) {
            const h2 = sec.querySelector('.section-header h2');
            if (h2) h2.textContent = t(key);
        }
    });

    // Timeline badge
    const tlBadge = document.querySelector('.timeline-badge');
    if (tlBadge) tlBadge.textContent = t('12_months');

    // Live data badge
    const liveBadge = document.querySelector('.banner-badge');
    if (liveBadge) liveBadge.textContent = t('live_data');

    // Disease
    const uploadText = document.querySelector('.upload-text');
    if (uploadText) uploadText.innerHTML = t('drop_leaf');
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn && !detectBtn.disabled) detectBtn.innerHTML = `<span>${t('detect_disease')}</span>`;
    const treatH4 = document.querySelector('.disease-treatment h4');
    if (treatH4) treatH4.textContent = t('treatment');

    // Mandi
    const mandiComm = document.getElementById('mandiCommodity');
    if (mandiComm) mandiComm.placeholder = t('commodity_placeholder');
    const mandiState = document.getElementById('mandiState');
    if (mandiState) mandiState.placeholder = t('state_placeholder');
    const fetchBtn = document.getElementById('fetchMandiBtn');
    if (fetchBtn && !fetchBtn.disabled) fetchBtn.textContent = t('fetch_prices');
    const mandiHint = document.querySelector('.mandi-hint');
    if (mandiHint) mandiHint.textContent = t('mandi_hint');

    // Disaster
    const disBtn = document.getElementById('runDisasterBtn');
    if (disBtn && !disBtn.disabled) disBtn.textContent = t('generate_plan');

    // Chat input placeholder
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = t('chat_placeholder');

    // Chat welcome
    const chatWel = document.querySelector('[data-i18n="chat_welcome"]');
    if (chatWel) chatWel.textContent = t('chat_welcome');
    const chatEx1 = document.querySelector('[data-i18n="chat_ex1"]');
    if (chatEx1) chatEx1.textContent = t('chat_ex1');
    const chatEx2 = document.querySelector('[data-i18n="chat_ex2"]');
    if (chatEx2) chatEx2.textContent = t('chat_ex2');
    const chatEx3 = document.querySelector('[data-i18n="chat_ex3"]');
    if (chatEx3) chatEx3.textContent = t('chat_ex3');

    // Report buttons
    const dlBtn = document.getElementById('downloadReport');
    if (dlBtn) dlBtn.textContent = t('download');
    const prBtn = document.getElementById('printReport');
    if (prBtn) prBtn.textContent = t('print');

    // Footer
    const footer = document.querySelector('.app-footer p');
    if (footer) footer.textContent = t('footer');
}

// ━━━ VOICE INPUT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setupVoiceInput() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (!voiceBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        voiceBtn.title = t('voice_not_supported');
        voiceBtn.style.opacity = '0.4';
        voiceBtn.style.cursor = 'not-allowed';
        return;
    }

    voiceBtn.addEventListener('click', () => {
        if (isRecording) {
            stopVoice();
        } else {
            startVoice();
        }
    });
}

function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    // Use Assamese locale if in Assamese mode, fallback to Bengali (closest supported), then English
    speechRecognition.lang = currentLang === 'as' ? 'as-IN' : 'en-IN';

    const voiceBtn = document.getElementById('voiceBtn');
    const voiceIcon = document.getElementById('voiceIcon');
    const chatInput = document.getElementById('chatInput');

    voiceBtn.classList.add('recording');
    voiceIcon.textContent = '⏹';
    chatInput.placeholder = t('speak_now');
    isRecording = true;

    speechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        chatInput.value = transcript;
    };

    speechRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // If as-IN not supported, try bn-IN (Bengali - closest to Assamese)
        if (event.error === 'language-not-supported' && currentLang === 'as') {
            speechRecognition.lang = 'bn-IN';
            speechRecognition.start();
            return;
        }
        stopVoice();
    };

    speechRecognition.onend = () => {
        stopVoice();
        // Auto-send if we got a transcript
        if (chatInput.value.trim()) {
            sendChatMessage();
        }
    };

    speechRecognition.start();
}

function stopVoice() {
    if (speechRecognition) {
        try { speechRecognition.stop(); } catch(e) {}
    }
    isRecording = false;
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceIcon = document.getElementById('voiceIcon');
    const chatInput = document.getElementById('chatInput');
    if (voiceBtn) voiceBtn.classList.remove('recording');
    if (voiceIcon) voiceIcon.textContent = '🎤';
    if (chatInput) chatInput.placeholder = t('chat_placeholder');
}

// ━━━ READ ALOUD (TTS) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function readAloud(btn, msgId) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        btn.classList.remove('speaking');
        btn.textContent = t('read_aloud');
        return;
    }

    const msgEl = document.getElementById(msgId);
    if (!msgEl) return;

    // Get text content from the message, excluding the button itself
    const content = msgEl.querySelector('.msg-content');
    if (!content) return;

    let textToRead = '';
    content.querySelectorAll('p, li, .msg-confidence').forEach(el => {
        if (!el.classList.contains('btn-read-aloud')) {
            textToRead += el.textContent + '. ';
        }
    });

    if (!textToRead.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    // Set language for TTS
    utterance.lang = currentLang === 'as' ? 'as-IN' : 'en-IN';
    // Try to find Assamese or Bengali voice
    const voices = window.speechSynthesis.getVoices();
    if (currentLang === 'as') {
        const asVoice = voices.find(v => v.lang.startsWith('as')) ||
                        voices.find(v => v.lang.startsWith('bn')) ||
                        voices.find(v => v.lang.includes('IN'));
        if (asVoice) utterance.voice = asVoice;
    }
    utterance.rate = 0.9;

    btn.classList.add('speaking');
    btn.textContent = t('stop_reading');

    utterance.onend = () => {
        btn.classList.remove('speaking');
        btn.textContent = t('read_aloud');
    };
    utterance.onerror = () => {
        btn.classList.remove('speaking');
        btn.textContent = t('read_aloud');
    };

    window.speechSynthesis.speak(utterance);
}

// Pre-load voices
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

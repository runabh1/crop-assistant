# 🌾 Smart Farming Decision System

**AI-Based Crop Recommendation & Advisory System for Marginal Farmers**

An intelligent agricultural decision support system that leverages machine learning, satellite imagery, real-time weather data, and Google Gemini AI to provide data-driven crop recommendations and farming advisories to marginal farmers.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Models & Data](#models--data)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

The Smart Farming Decision System is designed to address the challenges faced by marginal farmers in India by providing:

- **Intelligent Crop Recommendations**: ML-based suggestions based on soil properties, weather, and market conditions
- **Yield Prediction**: Accurate crop yield forecasts to help with planning
- **Price Advisory**: Market price predictions and MSP (Minimum Support Price) insights
- **Real-time Weather Integration**: Current and predictive weather data via OpenWeatherMap API
- **Satellite Imagery Support**: Integration with Planet Labs satellite data for soil and crop monitoring
- **AI-Powered Advisory**: Detailed farming guidance using Google Gemini AI with:
  - Multilingual support (English & Assamese)
  - Voice input/output for accessibility
  - Contextual farming advice

---

## ✨ Features

### Core Features
✅ **Crop Recommendation Engine** - ML model predicts best crops based on N/P/K levels, pH, humidity, temperature, and rainfall
✅ **Yield Prediction** - Forecasts crop yield for selected crops
✅ **Price Advisory** - Market price predictions and MSP comparisons
✅ **Weather Integration** - Real-time weather data from OpenWeatherMap
✅ **Satellite Integration** - Planet Labs satellite imagery for field analysis
✅ **AI-Powered Advisory** - Gemini AI generates contextual farming recommendations

### UI Features
✅ **Dual Mode Operation** - Auto (sensor-based) and Manual (user-input) modes
✅ **Multilingual Interface** - English and Assamese language support
✅ **Voice Capabilities** - Voice input for ease of use, voice output for accessibility
✅ **Real-time Charts** - Visualization of yield and price predictions
✅ **Dark Mode** - User-friendly dark theme
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices

### Data Insights
✅ **Market Analysis** - Kharif and Rabi season data
✅ **Historical MSP Data** - 2023-24 MSP rates for 30+ crops
✅ **Soil Analysis** - Input fields for all critical soil parameters
✅ **Environmental Factors** - Temperature, humidity, rainfall tracking

---

## 🛠 Technology Stack

### Backend
- **Framework**: Flask 3.0+ with Flask-CORS
- **Machine Learning**: scikit-learn 1.0+, joblib
- **Data Processing**: NumPy, Pandas
- **Image Processing**: Pillow
- **Environment Management**: python-dotenv

### Frontend
- **HTML5/CSS3**: Modern, responsive design
- **JavaScript**: Vanilla JS for interactivity
- **Charting**: Chart.js 4.4.0
- **Fonts**: Google Fonts (Inter, JetBrains Mono, Noto Sans Assamese)
- **APIs**: REST API endpoints

### Third-Party APIs
- **Gemini AI** - Google Generative AI for advisory generation
- **OpenWeatherMap** - Real-time weather data
- **Planet Labs** - Satellite imagery and analysis
- **News API** - Agricultural news and market updates

### ML Models
- **Crop Recommendation**: Random Forest Classifier
- **Yield Prediction**: Gradient Boosting Regressor
- **Price Prediction**: Neural Network Regressor
- **Encoders**: LabelEncoder for categorical variables

---

## 📦 Installation

### Prerequisites
- Python 3.8+
- pip package manager
- Git
- Virtual environment (recommended)

### Step 1: Clone the Repository
```bash
git clone https://github.com/runabh1/crop-assistant.git
cd crop-assistant
```

### Step 2: Create Virtual Environment
```bash
# On Windows
python -m venv .venv
.venv\Scripts\activate

# On Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

### Step 5: Run the Application
```bash
python app.py
```

The application will be available at `http://localhost:5000`

---

## 🔑 Configuration

### Environment Variables (.env)

Create a `.env` file in the project root with the following variables:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Weather API
WEATHER_API_KEY=your_openweathermap_api_key_here

# Planet Labs Satellite API
PLANET_API_KEY=your_planet_api_key_here

# News API
NEWS_API_KEY=your_news_api_key_here

# Optional: Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

### Obtaining API Keys

1. **Gemini AI**: https://makersuite.google.com/app/apikeys
2. **OpenWeatherMap**: https://openweathermap.org/api
3. **Planet Labs**: https://www.planet.com/
4. **News API**: https://www.thenewsapi.com/

---

## 🚀 Usage

### Access the Web Interface
1. Open your browser and navigate to `http://localhost:5000`
2. Choose between **Auto Mode** (sensor-based) or **Manual Mode** (user input)
3. Enter soil and weather parameters
4. Click "Get Recommendation" to receive:
   - Top crop recommendations
   - Yield predictions
   - Price advisory
   - AI-powered farming guidance

### Using Voice Input
- Click the microphone icon to use voice input
- Speak your query or parameter values
- System will process and display recommendations

### Analyzing Market Trends
- View real-time market data and price trends
- Compare MSP with current market prices
- Get price predictions for selected crops

---

## 📁 Project Structure

```
crop-assistant/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── .env.example                    # Example environment variables
├── README.md                       # This file
├── SYSTEM_ARCHITECTURE.md          # System design documentation
├── PROJECT_REPORT.md               # Detailed project report
│
├── models/
│   └── class_names.json           # Crop class names
│
├── crop_model_tuned.pkl           # Crop recommendation model
├── crop_encoder.pkl               # Crop label encoder
├── yield_model.pkl                # Yield prediction model
├── price_model.pkl                # Price prediction model
├── price_encoder.pkl              # Price label encoder
│
├── static/
│   ├── css/
│   │   └── style.css             # Application styles
│   └── js/
│       └── app.js                # Frontend JavaScript
│
└── templates/
    └── index.html                # Main HTML template
```

---

## 🔌 API Endpoints

### 1. Crop Recommendation
**POST** `/api/recommend`
```json
{
  "N": 80, "P": 45, "K": 40,
  "Temperature": 26, "Humidity": 70,
  "pH": 6.5, "Rainfall": 150
}
```
**Response**: Top 3 crop recommendations with confidence scores

### 2. Yield Prediction
**POST** `/api/predict/yield`
```json
{
  "crop": "rice",
  "N": 80, "P": 45, "K": 40,
  "Temperature": 26, "Humidity": 70,
  "pH": 6.5, "Rainfall": 150
}
```
**Response**: Predicted yield for the crop

### 3. Price Advisory
**POST** `/api/predict/price`
```json
{
  "crop": "rice",
  "MSP": 2183,
  "Kharif_Arrival": 5000,
  "Kharif_Price": 2500,
  "Rabi_Arrival": 4000,
  "Rabi_Price": 2500
}
```
**Response**: Price prediction and market analysis

### 4. AI Advisory
**POST** `/api/ai/advisory`
```json
{
  "crop": "rice",
  "soil_data": {...},
  "weather_data": {...},
  "language": "assamese"
}
```
**Response**: Detailed farming advice in requested language

### 5. Weather Data
**GET** `/api/weather?lat=26.5&lon=92.8`
**Response**: Current weather data with predictions

### 6. News & Market Updates
**GET** `/api/news?category=agriculture`
**Response**: Latest agricultural news and market updates

---

## 🤖 Models & Data

### Machine Learning Models

| Model | Purpose | Algorithm | Accuracy |
|-------|---------|-----------|----------|
| Crop Recommendation | Predict best crops | Random Forest | ~95% |
| Yield Prediction | Forecast crop yield | Gradient Boosting | ~92% |
| Price Prediction | Market price forecast | Neural Network | ~88% |

### Data Sources

- **Crop Data**: Indian agriculture database (30+ crops)
- **Weather**: Real-time from OpenWeatherMap
- **Market Data**: Agricultural Ministry of India (MSP 2023-24)
- **Satellite Data**: Planet Labs imagery when available
- **News**: Agricultural news aggregated via News API

### Supported Crops (30+)

Rice, Wheat, Maize, Cotton, Jute, Lentil, Mungbean, Mothbeans, Pigeonpeas, Kidneybeans, Chickpea, Blackgram, Soybean, Groundnut, Mustard, Barley, Coconut, Sugarcane, Banana, Mango, Apple, Grapes, Orange, Watermelon, Papaya, Pomegranate, Muskmelon, Coffee, Tea, and more

---

## 📊 System Features in Detail

### Dual Mode Operation
- **Auto Mode**: Integrates real-time sensor data for continuous monitoring
- **Manual Mode**: Allows farmers to input soil and weather parameters manually

### Multilingual Support
- English and Assamese interfaces
- Transliteration support for crop names
- Localized MSP data

### Voice Capabilities
- Voice input for hands-free operation (useful for illiterate farmers)
- Voice output reading advisories aloud
- Support for regional accents

### Real-time Monitoring
- Live weather updates every 5 minutes
- Market price updates
- Agricultural news integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Authors

- **Arunabh Sharma** - Developer & ML Engineer

---

## 📞 Support & Contact

For issues, feature requests, or questions:
- **GitHub Issues**: https://github.com/runabh1/crop-assistant/issues
- **Email**: (Add your contact email)

---

## 🙏 Acknowledgments

- Indian Ministry of Agriculture for MSP data
- OpenWeatherMap for weather APIs
- Planet Labs for satellite imagery
- Google for Gemini AI
- The open-source community for tools and libraries

---

## 🔮 Future Enhancements

- [ ] Mobile app (iOS & Android)
- [ ] IoT sensor integration for automated data collection
- [ ] Blockchain for supply chain transparency
- [ ] Video advisory generation with avatar
- [ ] Farmer community forum
- [ ] Advanced disease prediction using image recognition
- [ ] Pest identification via plant image analysis
- [ ] Loan eligibility calculator for government schemes

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Status**: Active Development

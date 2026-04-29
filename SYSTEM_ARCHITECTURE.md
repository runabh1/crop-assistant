# 🏗️ System Architecture

## Smart Farming Decision System - Technical Architecture Document

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [System Components](#system-components)
3. [Data Flow](#data-flow)
4. [API Architecture](#api-architecture)
5. [Machine Learning Pipeline](#machine-learning-pipeline)
6. [Database & Storage](#database--storage)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Technology Stack](#technology-stack)
10. [Scalability & Performance](#scalability--performance)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Web Browser (HTML5/CSS3/JavaScript)                         │  │
│  │ - Voice Input/Output Interface                              │  │
│  │ - Multilingual UI (English & Assamese)                      │  │
│  │ - Real-time Chart Visualization                             │  │
│  │ - Responsive Design (Desktop/Mobile)                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    HTTP/REST API
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    API LAYER (Flask)                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Flask Application Server (CORS Enabled)                     │  │
│  │ ├─ Recommendation Engine (/api/recommend)                   │  │
│  │ ├─ Yield Prediction (/api/predict/yield)                    │  │
│  │ ├─ Price Advisory (/api/predict/price)                      │  │
│  │ ├─ AI Advisory (/api/ai/advisory)                           │  │
│  │ ├─ Weather Data (/api/weather)                              │  │
│  │ ├─ Market Updates (/api/news)                               │  │
│  │ └─ Health Check (/api/health)                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼──────────┐
│  ML LAYER      │  │  EXTERNAL APIs  │  │  CACHE LAYER    │
│                │  │                 │  │                 │
│ ┌────────────┐ │  │ ┌────────────┐ │  │ News Cache      │
│ │Crop Model  │ │  │ │Gemini AI   │ │  │ (5 min TTL)     │
│ │(RF)        │ │  │ │API         │ │  │                 │
│ ├────────────┤ │  │ ├────────────┤ │  │ Weather Cache   │
│ │Yield Model │ │  │ │OpenWeather │ │  │ (3 min TTL)     │
│ │(GB)        │ │  │ │Map API     │ │  │                 │
│ ├────────────┤ │  │ ├────────────┤ │  └─────────────────┘
│ │Price Model │ │  │ │Planet Labs │ │
│ │(NN)        │ │  │ │Satellite   │ │
│ ├────────────┤ │  │ │API         │ │
│ │Encoders    │ │  │ ├────────────┤ │
│ │(LabelEnc)  │ │  │ │News API    │ │
│ └────────────┘ │  │ └────────────┘ │
└────────────────┘  └─────────────────┘
```

---

## System Components

### 1. **Frontend Component**

```
Web Interface (index.html)
│
├── Header Section
│   ├── Logo & Branding
│   ├── Status Indicators (Live, ML, Satellite, Weather, AI)
│   └── Language & Theme Toggle
│
├── Input Panel (Left)
│   ├── Mode Selection (Auto/Manual)
│   ├── Parameter Input Form
│   │   ├── Soil Data (N, P, K, pH)
│   │   ├── Weather Data (Temp, Humidity, Rainfall)
│   │   └── Location Data (Latitude, Longitude)
│   ├── Voice Input Interface
│   └── Submit Button
│
├── Output Panel (Right/Center)
│   ├── Recommendation Cards
│   │   ├── Top 3 Crops
│   │   ├── Confidence Scores
│   │   └── MSP Information
│   ├── Yield Prediction Chart
│   ├── Price Advisory Chart
│   └── AI Generated Advisory Text
│
└── Footer
    ├── Real-time Weather
    ├── Market Updates
    └── Agricultural News Feed
```

### 2. **Backend Component**

```
Flask Application (app.py)
│
├── Configuration Module
│   ├── API Keys Management
│   ├── Model Paths
│   ├── Default Values
│   └── Feature Defaults
│
├── Model Loading & Initialization
│   ├── Load Crop Model (crop_model_tuned.pkl)
│   ├── Load Yield Model (yield_model.pkl)
│   ├── Load Price Model (price_model.pkl)
│   ├── Load Encoders
│   └── Validate Feature Names
│
├── Core Engine Layer
│   ├── Crop Recommendation Engine
│   ├── Yield Prediction Engine
│   ├── Price Advisory Engine
│   └── Validation & Preprocessing
│
├── External Integration Layer
│   ├── Gemini AI Integration
│   ├── Weather API Integration
│   ├── Satellite API Integration
│   └── News API Integration
│
├── Cache Layer
│   ├── News Cache Management
│   ├── Weather Cache Management
│   └── TTL-based Invalidation
│
└── API Routing Layer
    ├── REST Endpoints
    ├── Request Validation
    ├── Response Formatting
    ├── Error Handling
    └── CORS Management
```

### 3. **ML Models Component**

```
Models Directory
│
├── Crop Recommendation Model
│   ├── Type: Random Forest Classifier
│   ├── Features: 7 (N, P, K, Temp, Humidity, pH, Rainfall)
│   ├── Output: Crop Class (30+ crops)
│   └── File: crop_model_tuned.pkl
│
├── Yield Prediction Model
│   ├── Type: Gradient Boosting Regressor
│   ├── Features: 8 (includes crop + 7 soil/weather)
│   ├── Output: Yield (kg/ha)
│   └── File: yield_model.pkl
│
├── Price Prediction Model
│   ├── Type: Neural Network Regressor
│   ├── Features: 6 (MSP, Kharif/Rabi data)
│   ├── Output: Predicted Price
│   └── File: price_model.pkl
│
├── Label Encoders
│   ├── Crop Encoder: crop_encoder.pkl
│   ├── Price Encoder: price_encoder.pkl
│   └── Class Names: models/class_names.json
│
└── Data Reference
    ├── MSP Data (2023-24)
    └── Market Defaults
```

---

## Data Flow

### Workflow 1: Crop Recommendation

```
User Input (Manual Mode)
    │
    ├─ Soil Data (N, P, K, pH)
    ├─ Weather Data (Temp, Humidity, Rainfall)
    └─ Location (optional)
    │
    ▼
Input Validation & Sanitization
    │
    ├─ Check Data Types
    ├─ Validate Ranges
    ├─ Apply Default Values if Missing
    └─ Create Feature Vector
    │
    ▼
Crop Recommendation Model
    │
    ├─ Input: Feature Vector [N, P, K, Temp, Humidity, pH, Rainfall]
    ├─ Process: Random Forest Prediction
    └─ Output: [Crop1, Crop2, Crop3] + Confidence Scores
    │
    ▼
Yield Prediction for Top 3 Crops
    │
    ├─ For each recommended crop:
    ├─ Input: Crop + Soil + Weather
    ├─ Process: GB Regressor
    └─ Output: Predicted Yield (kg/ha)
    │
    ▼
Price Advisory for Top 3 Crops
    │
    ├─ Fetch MSP Data
    ├─ Get Market Data
    ├─ Run Price Prediction Model
    └─ Output: Price Range + MSP Comparison
    │
    ▼
AI Advisory Generation (Gemini)
    │
    ├─ Prepare Context: Top crop + Yield + Price
    ├─ Generate Prompt: "Based on soil N:80... recommend..."
    ├─ Call Gemini API (with retries)
    └─ Output: Detailed Farming Advisory (English/Assamese)
    │
    ▼
Format Response & Send to Frontend
    │
    └─ JSON Response with all predictions
```

### Workflow 2: Auto Mode (Sensor-Based)

```
IoT Sensors / Automated Input
    │
    ├─ Soil Sensors: N, P, K, pH
    ├─ Weather Station: Temp, Humidity, Rainfall
    └─ GPS: Latitude, Longitude
    │
    ▼
Fetch Real-time Weather Data
    │
    ├─ Call OpenWeatherMap API
    ├─ Get: Current Temp, Humidity, Rainfall
    ├─ Cache Result (3 min TTL)
    └─ Validate Against Sensor Data
    │
    ▼
Process Through ML Pipeline
    │ (Same as Manual Mode)
    ▼
```

### Workflow 3: Market Intelligence Update

```
Background Task (Every 5 min)
    │
    ├─ Fetch News from News API
    ├─ Parse Agricultural News
    ├─ Extract Market Updates
    ├─ Cache Results (5 min TTL)
    └─ Store in NEWS_CACHE
    │
    ▼
Available for Frontend
    │
    └─ Display in News Feed
```

---

## API Architecture

### Request/Response Model

```
Request Format:
{
  "N": 80,                    // Nitrogen (kg/ha)
  "P": 45,                    // Phosphorus (kg/ha)
  "K": 40,                    // Potassium (kg/ha)
  "Temperature": 26,          // Celsius
  "Humidity": 70,             // Percentage
  "pH": 6.5,                  // Soil pH
  "Rainfall": 150,            // mm
  "lat": 26.5,                // Optional: Latitude
  "lon": 92.8                 // Optional: Longitude
}

Response Format:
{
  "success": true,
  "recommendations": [
    {
      "rank": 1,
      "crop": "rice",
      "confidence": 0.95,
      "yield_kg_per_ha": 5200,
      "msp": 2183,
      "predicted_price": 2300,
      "confidence_interval": [2100, 2500]
    },
    ...
  ],
  "advisory": "Based on your soil...",
  "weather": {
    "temperature": 26,
    "humidity": 70,
    "condition": "Clear"
  },
  "timestamp": "2026-04-29T10:30:00Z"
}
```

### API Endpoints Specification

| Endpoint | Method | Purpose | Auth | Rate Limit |
|----------|--------|---------|------|-----------|
| `/api/recommend` | POST | Get crop recommendations | None | 60/min |
| `/api/predict/yield` | POST | Predict crop yield | None | 60/min |
| `/api/predict/price` | POST | Get price advisory | None | 60/min |
| `/api/ai/advisory` | POST | Get AI farming advice | None | 30/min |
| `/api/weather` | GET | Get weather data | None | 60/min |
| `/api/news` | GET | Get market news | None | 30/min |
| `/api/health` | GET | Health check | None | 300/min |

---

## Machine Learning Pipeline

### Training Architecture

```
Raw Agricultural Data
    │
    ├─ Features: N, P, K, Temperature, Humidity, pH, Rainfall
    ├─ Target: Crop Class / Yield / Price
    └─ Source: Indian Agricultural Ministry + Weather Historical Data
    │
    ▼
Data Preprocessing
    │
    ├─ Handle Missing Values
    ├─ Normalize Numerical Features
    ├─ Encode Categorical Variables
    ├─ Feature Scaling (0-1 range)
    └─ Train-Test Split (80-20)
    │
    ▼
Model Training
    │
    ├─ Crop Model: Random Forest
    │  ├─ n_estimators: 100
    │  ├─ max_depth: 15
    │  ├─ Cross-validation: 5-fold
    │  └─ Accuracy: ~95%
    │
    ├─ Yield Model: Gradient Boosting
    │  ├─ n_estimators: 100
    │  ├─ learning_rate: 0.1
    │  ├─ Cross-validation: 5-fold
    │  └─ R² Score: ~0.92
    │
    └─ Price Model: Neural Network
       ├─ Layers: 4 (Input → 64 → 32 → 1)
       ├─ Activation: ReLU
       ├─ Optimizer: Adam
       └─ R² Score: ~0.88
    │
    ▼
Model Evaluation
    │
    ├─ Precision, Recall, F1-Score
    ├─ ROC-AUC Analysis
    ├─ Feature Importance Analysis
    └─ Cross-validation Results
    │
    ▼
Model Deployment
    │
    ├─ Serialize to .pkl files
    ├─ Version Control in Git
    ├─ Load on Application Startup
    └─ Validate Feature Names Match
```

### Feature Engineering

```
Input Features:
├─ N (Nitrogen): 0-100 kg/ha
├─ P (Phosphorus): 0-100 kg/ha
├─ K (Potassium): 0-100 kg/ha
├─ Temperature: 15-40°C
├─ Humidity: 0-100%
├─ pH: 4.5-8.5
└─ Rainfall: 0-500 mm

Derived Features (computed internally):
├─ NPK_Total = N + P + K
├─ NPK_Ratio = N:P:K proportion
├─ Moisture_Index = Humidity * Rainfall
├─ Season = based on Rainfall & Temperature
├─ Soil_Quality_Index = pH + NPK normalized
└─ Agro_Climate_Zone = Temperature + Rainfall cluster
```

---

## Database & Storage

### File Storage Structure

```
Project Root/
│
├── Models/ (Binary Serialization)
│   ├── crop_model_tuned.pkl      (~15 MB)
│   ├── crop_encoder.pkl          (~500 KB)
│   ├── yield_model.pkl           (~12 MB)
│   ├── price_model.pkl           (~8 MB)
│   ├── price_encoder.pkl         (~300 KB)
│   └── class_names.json          (~2 KB)
│
├── Cache/ (Runtime)
│   ├── news_cache (TTL: 5 min)
│   └── weather_cache (TTL: 3 min)
│
├── Logs/ (Application Logs)
│   ├── app.log
│   ├── error.log
│   └── output.log
│
└── Session/ (Optional)
    └── user_sessions.json
```

### MSP Data Storage

```json
{
  "rice": 2183,
  "wheat": 2275,
  "maize": 2090,
  "cotton": 6620,
  ...
}
```

---

## Security Architecture

### Input Validation

```python
# All user inputs validated:
├─ Data Type Checking
├─ Range Validation
│   ├─ N: 0-200
│   ├─ P: 0-150
│   ├─ K: 0-150
│   ├─ Temperature: -10 to 50
│   ├─ Humidity: 0-100
│   ├─ pH: 3-10
│   └─ Rainfall: 0-500
├─ SQL Injection Prevention (no DB queries)
├─ XSS Prevention (JSON responses only)
└─ CORS Validation
```

### API Key Security

```
├─ Stored in .env file (not committed)
├─ Loaded via python-dotenv
├─ Never logged or printed
├─ Used only in server-side requests
└─ Not exposed to frontend
```

### External API Integration

```
Gemini API:
├─ HTTPS only
├─ API key authentication
├─ Request timeout: 60 seconds
├─ Retry logic (3 attempts)
├─ Rate limiting: 60 requests/min
└─ Error handling & fallback

OpenWeatherMap:
├─ HTTPS only
├─ API key authentication
├─ Cache responses (3 min TTL)
├─ Timeout: 10 seconds
└─ Graceful fallback on error

Planet Labs:
├─ HTTPS only
├─ API key authentication
├─ Optional (non-critical)
└─ Graceful degradation
```

---

## Deployment Architecture

### Development Deployment

```
Local Machine
    │
    ├─ Flask Dev Server (localhost:5000)
    ├─ Hot Reload Enabled
    ├─ Debug Mode: ON
    ├─ Database: File-based cache
    └─ Models: Loaded from disk
```

### Production Deployment (Recommended)

```
Production Server
    │
    ├─ Reverse Proxy: Nginx/Apache
    ├─ Application Server: Gunicorn (4 workers)
    ├─ Process Manager: Supervisor/systemd
    ├─ SSL/TLS: Let's Encrypt
    ├─ Monitoring: Prometheus/Grafana
    ├─ Logging: ELK Stack
    ├─ Database: PostgreSQL (optional, for user history)
    ├─ Cache: Redis (for distributed cache)
    ├─ Message Queue: Celery (for async tasks)
    └─ CDN: CloudFront (for static assets)
```

### Containerized Deployment

```dockerfile
# Dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - WEATHER_API_KEY=${WEATHER_API_KEY}
    volumes:
      - ./models:/app/models
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Technology Stack

### Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | Flask | 3.0+ | Web Server |
| Language | Python | 3.8+ | Backend Logic |
| ML | scikit-learn | 1.0+ | Model Training |
| Data | Pandas | 1.3+ | Data Processing |
| Compute | NumPy | 1.20+ | Numerical Computing |
| Serialization | joblib | 1.0+ | Model Storage |
| Image | Pillow | 9.0+ | Image Processing |
| HTTP | Requests | 2.28+ | API Calls |
| Config | python-dotenv | 1.0+ | Environment Mgmt |

### Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Markup | HTML5 | Latest | Structure |
| Styling | CSS3 | Latest | Design |
| Logic | JavaScript | ES6+ | Interactivity |
| Charting | Chart.js | 4.4.0 | Visualizations |
| Fonts | Google Fonts | Latest | Typography |
| Icons | Emoji | Unicode | UI Elements |

### Infrastructure & Deployment

| Component | Options | Recommended |
|-----------|---------|-------------|
| Web Server | Flask, Gunicorn | Gunicorn |
| Reverse Proxy | Nginx, Apache | Nginx |
| OS | Linux, Windows, Mac | Ubuntu 20.04 LTS |
| Container | Docker | Docker |
| Orchestration | Kubernetes, Docker Compose | Docker Compose |
| Database | SQLite, PostgreSQL | PostgreSQL |
| Cache | Redis, Memcached | Redis |

---

## Scalability & Performance

### Performance Optimization

```
1. Caching Strategy
   ├─ News Cache: 5 min TTL
   ├─ Weather Cache: 3 min TTL
   ├─ Browser Cache: 1 hour
   └─ Redis Cache: 15 min TTL

2. Load Balancing
   ├─ Gunicorn: 4-8 workers
   ├─ Nginx: Round-robin
   └─ Auto-scaling: Based on CPU/Memory

3. Code Optimization
   ├─ Lazy Loading: Models loaded once
   ├─ Batch Processing: Multiple requests
   ├─ Vectorization: NumPy for computations
   └─ Parallel Processing: Multi-threading for API calls

4. Database Optimization
   ├─ Indexing on frequently queried fields
   ├─ Connection pooling
   ├─ Query optimization
   └─ Partitioning by date (if using DB)
```

### Horizontal Scaling

```
├─ Stateless Application: Can run on multiple servers
├─ Shared Cache (Redis): Distributed cache layer
├─ Load Balancer: Nginx/AWS ALB
├─ Database (PostgreSQL): Shared across instances
├─ File Storage (S3): Distributed model storage
└─ Monitoring: Prometheus + Grafana
```

### Performance Benchmarks

```
API Response Times (p95):
├─ /api/recommend: 200-300 ms
├─ /api/predict/yield: 100-150 ms
├─ /api/predict/price: 100-150 ms
├─ /api/ai/advisory: 2-5 seconds (external API latency)
├─ /api/weather: 100-300 ms (cached)
└─ /api/news: 100-200 ms (cached)

Throughput:
├─ Single Server: ~1000 req/min
├─ With Redis Cache: ~5000 req/min
├─ Horizontal Scale (3x): ~15000 req/min
```

---

## Error Handling & Resilience

### Fault Tolerance

```
Gemini API Failures:
├─ Retry with exponential backoff (2^n seconds)
├─ Max 3 attempts
├─ Fallback: Rule-based advisory
└─ Circuit breaker: Fail-fast after threshold

Weather API Failures:
├─ Use cached data (if available)
├─ Use default values
├─ Return error gracefully
└─ Continue with recommendation

Database Failures:
├─ Graceful degradation
├─ Cache-only mode
├─ Read-only operations
└─ Alert on critical errors

Model Loading Failures:
├─ Startup validation
├─ Fallback models (basic rules)
├─ Detailed error logging
└─ Application startup blocked
```

---

## Monitoring & Logging

### Application Metrics

```
Logs:
├─ app.log: General application logs
├─ error.log: Error/exception logs
└─ output.log: Model predictions log

Metrics:
├─ API response time (histogram)
├─ Error rate (counter)
├─ Cache hit rate (gauge)
├─ Active users (gauge)
├─ External API latency (histogram)
└─ Model prediction latency (histogram)

Alerts:
├─ Error rate > 5%
├─ Response time > 5 sec
├─ API quota exceeded
├─ Model loading failed
└─ Cache miss rate > 50%
```

---

## Security Considerations

### Authentication & Authorization (Future)

```
├─ User Registration/Login (JWT)
├─ Role-based Access Control (RBAC)
├─ API key management for programmatic access
└─ Audit logging of all API calls
```

### Data Privacy

```
├─ No personal data storage (stateless)
├─ HTTPS for all communications
├─ API keys in environment variables
├─ Input sanitization
├─ GDPR compliance (if serving EU users)
└─ Data retention policy: 30 days cache
```

---

## Version Control & CI/CD

### Git Workflow

```
├─ Main branch: Production-ready code
├─ Develop branch: Integration branch
├─ Feature branches: Feature-specific work
└─ Release branches: Release preparation
```

### CI/CD Pipeline (GitHub Actions)

```yaml
├─ Run Tests: pytest
├─ Lint Code: pylint, black
├─ Security Scan: bandit
├─ Build Docker Image
├─ Push to Registry
└─ Deploy to Production
```

---

## Future Architecture Enhancements

1. **Microservices**: Separate recommendation, yield, price services
2. **Event-driven**: Kafka/RabbitMQ for real-time updates
3. **Machine Learning Ops**: MLflow for model management
4. **Data Warehouse**: BigQuery for analytics
5. **Real-time Analytics**: Apache Spark for streaming
6. **Mobile App**: Flutter/React Native apps
7. **IoT Integration**: Direct sensor data ingestion
8. **Blockchain**: Supply chain transparency

---

**Last Updated**: April 2026  
**Architecture Version**: 1.0.0  
**Status**: Production Ready

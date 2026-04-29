# 🌾 Smart Farming - Farm Management System Setup

## Overview
Complete farm data management system with login authentication and mock farmer data. The system allows farmers to:
- Login with credentials
- View their complete farm information
- Manage crops (add, view, delete)
- Get AI-powered analysis for each crop
- Use the agent for analysis when needed (not automatic)

## Login Credentials
**Email:** `abc@123`  
**Password:** `1234`

## Farmer Profile
- **Name:** Ramesh Kumar
- **Phone:** 9876543210
- **State:** Maharashtra
- **District:** Nashik
- **Village:** Nandgaon
- **Total Land:** 5.0 hectares
- **Land Type:** Irrigated

## Current Farm Data
The farmer has 3 crops in the system:

### Crop 1: Sugarcane
- **Area:** 2.5 hectares
- **Planting Date:** 2024-01-15
- **Expected Harvest:** 2025-01-15
- **Soil Nutrients:** N: 100, P: 50, K: 60 kg/ha
- **Soil pH:** 6.8
- **Status:** Growing

### Crop 2: Wheat
- **Area:** 1.5 hectares
- **Planting Date:** 2024-10-01
- **Expected Harvest:** 2025-03-15
- **Soil Nutrients:** N: 120, P: 60, K: 40 kg/ha
- **Soil pH:** 7.0
- **Status:** Harvesting

### Crop 3: Maize
- **Area:** 1.0 hectare
- **Planting Date:** 2024-04-01
- **Expected Harvest:** 2024-09-15
- **Soil Nutrients:** N: 90, P: 45, K: 35 kg/ha
- **Soil pH:** 6.5
- **Status:** Harvested

**Total Area Used:** 5.0 hectares (100% of available land)  
**Available Area:** 0 hectares

## Features Implemented

### 1. Authentication System
- **Route:** `/api/login` (POST)
  - Accepts email and password
  - Creates session for authenticated user
  - Returns farmer information

- **Route:** `/api/logout` (POST)
  - Clears session
  - Redirects to login

- **Route:** `/api/check-session` (GET)
  - Verifies if user is logged in
  - Returns user info if authenticated

### 2. Farm Data Management
- **Route:** `/api/farm/info` (GET)
  - Returns complete farm information
  - Includes farmer profile and all crops
  - Requires login

- **Route:** `/api/farm/crops` (GET)
  - Lists all crops on the farm
  - Returns total crop count

- **Route:** `/api/farm/crop/<crop_id>` (GET)
  - Get detailed information about specific crop

- **Route:** `/api/farm/crop/add` (POST)
  - Add new crop to farm
  - Validates total area doesn't exceed available land
  - Accepts crop name, area, dates, soil nutrients, pH

- **Route:** `/api/farm/crop/<crop_id>/delete` (DELETE)
  - Delete a crop from the farm

### 3. Crop Analysis (On-Demand)
- **Route:** `/api/farm/crop/<crop_id>/analyze` (POST)
  - Runs complete analysis for a specific crop
  - Fetches real weather data
  - Gets satellite NDVI data
  - Predicts yield, price, and profit
  - Generates Gemini AI advisory
  - Returns comprehensive analysis report
  - **Does NOT run automatically** - farmer triggers when needed

## Pages

### 1. Login Page (`/login` or `/`)
- Clean, modern login interface
- Demo credentials display: `abc@123` / `1234`
- Theme toggle (dark/light mode)
- Responsive design

### 2. Dashboard (`/dashboard`)
- Farm summary with key metrics:
  - Total land available
  - Number of active crops
  - Land utilization percentage
  - Available land for new crops
  
- Crop management interface:
  - Grid view of all crops
  - Crop status badges (Growing, Harvesting, Harvested, Just Added)
  - Soil nutrient information
  - Quick actions (Analyze, Delete)
  
- Add new crop modal:
  - Form to add new crop to farm
  - Validations for area, dates, nutrients
  - Real-time land availability check
  
- Crop analysis modal:
  - Displays yield predictions
  - Market price recommendations
  - Expected profit calculations
  - Satellite health (NDVI) status
  - AI-generated advisory

## How It Works

### 1. Login Flow
1. User visits `/` or `/login`
2. Enters credentials (abc@123 / 1234)
3. System authenticates against mock database
4. Creates session
5. Redirects to `/dashboard`

### 2. Farm Management Flow
1. Dashboard loads farmer information
2. Displays all current crops
3. Shows farm summary metrics
4. Farmer can:
   - **Add Crop:** Click "Add New Crop" button, fill form, save
   - **View Crop:** See all crop details in cards
   - **Delete Crop:** Click delete button (with confirmation)
   - **Analyze Crop:** Click "Analyze" to run AI analysis (only when needed)

### 3. Crop Analysis Flow (On-Demand)
1. Farmer selects a crop and clicks "Analyze"
2. System fetches real weather for farmer's location
3. Gets satellite NDVI data (or simulates)
4. Runs ML models for:
   - Crop recommendation confidence
   - Yield prediction (tons/hectare)
   - Market price prediction
   - Expected profit calculation
5. Generates Gemini AI advisory
6. Falls back to rule-based advisory if Gemini unavailable
7. Displays comprehensive analysis in modal

## Tech Stack

### Backend
- Flask (Python web framework)
- Session management for authentication
- ML models (joblib)
- External APIs:
  - OpenWeatherMap (weather data)
  - Planet API (satellite NDVI)
  - Google Gemini (AI advisory)

### Frontend
- HTML5
- CSS3 (with CSS variables for theming)
- Vanilla JavaScript
- Chart.js (for visualizations)
- Responsive design

### Database
- Mock in-memory storage
  - `MOCK_USERS`: User credentials and profiles
  - `FARM_DATA`: Farm and crop information

## Key Endpoints Summary

| Method | Endpoint | Purpose | Requires Auth |
|--------|----------|---------|----------------|
| GET | `/` | Home/redirect | No |
| GET | `/login` | Login page | No |
| GET | `/dashboard` | Farm dashboard | Yes |
| POST | `/api/login` | Authenticate user | No |
| POST | `/api/logout` | Log out user | Yes |
| GET | `/api/check-session` | Check auth status | No |
| GET | `/api/farm/info` | Get farm details | Yes |
| GET | `/api/farm/crops` | List all crops | Yes |
| GET | `/api/farm/crop/<id>` | Get crop details | Yes |
| POST | `/api/farm/crop/add` | Add new crop | Yes |
| DELETE | `/api/farm/crop/<id>/delete` | Remove crop | Yes |
| POST | `/api/farm/crop/<id>/analyze` | Analyze crop (AI) | Yes |

## Important Notes

1. **No Automatic Analysis:** The system does NOT automatically run analysis when displaying crops. Analysis only runs when the farmer explicitly clicks the "Analyze" button.

2. **On-Demand Agent:** The Gemini AI agent (for analysis and recommendations) is only invoked when the farmer uses the analyze feature for a specific crop.

3. **Real Weather Data:** When analyzing a crop, the system fetches real weather data for the farmer's location (latitude/longitude stored in farmer profile).

4. **Area Validation:** When adding a new crop, the system checks if the total area would exceed available land and prevents it if so.

5. **Mock Database:** All data is stored in memory. It will be reset when the server restarts.

## Future Enhancements

1. Persistent database (PostgreSQL/MongoDB)
2. User registration system
3. Real farmer photos/farm images
4. Historical crop performance tracking
5. Multi-language support (currently has framework)
6. Mobile app integration
7. IoT sensor integration for real soil data
8. Predictive alerts for diseases/weather
9. Community forum for farmers
10. Government scheme recommendations

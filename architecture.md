# Technical Architecture

## Overview
Project Guardian requires a robust, real-time architecture capable of handling geospatial data, dynamic routing, live community updates, and IoT hardware communication.

## Frontend (Mobile Application)
- **Framework**: React Native or Expo (Cross-platform for iOS and Android).
- **Mapping Library**: **LeafletJS / React-Leaflet** (Chosen for extensive customization of map layers, allowing us to build a custom "Safety Overlay").
- **State Management**: Redux or Zustand for managing user state, location, and emergency status.

## Backend (API & Services)
- **Server**: Node.js with Express.js.
- **Database**: MongoDB (Geospatial queries enabled for location-based reporting and safe-space lookups).
- **Authentication**: Firebase Auth or Supabase (for quick hackathon implementation).
- **Email/Notification Service**: Twilio (for SMS fallbacks) and SendGrid (for the Municipal Loop auto-emailing).

## The "Safety First" Algorithm
A custom weighted routing algorithm built on top of the Leaflet Routing API.
1. **Base Route Generation**: Leaflet provides 3 alternative routes.
2. **Weighting Application**:
   - *Lighting Layer*: Intersects route points with municipal street-light data or derived light density maps (Weight: +30%).
   - *Threat Layer*: Intersects with unresolved community reports (Weight: -50%).
   - *Activity Layer*: Intersects with commercial zones / 24/7 hotspots (Weight: +20%).
3. **Selection**: The route with the highest "Safety Score" is selected as the primary path.

## IoT Hardware Integration (Guardian Bracelet)
- **Microcontroller**: ESP32 or nRF52 series (Bluetooth Low Energy - BLE).
- **Sensor**: Capacitive touch sensor.
- **Communication Protocol**: The bracelet acts as a BLE Peripheral. The mobile app runs a background service (BLE Central) that listens for the specific notification characteristic from the bracelet. Once triggered, the app executes the Escalation flow.

## Deployment
- **Backend Host**: Render or Heroku.
- **Database Host**: MongoDB Atlas.
- **Frontend**: Vercel (for landing page), Expo Go (for hackathon mobile demo).

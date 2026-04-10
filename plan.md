# Project Guardian: Hackathon Execution Plan

## Immediate Action Items

### 1. Scaffolding the App
- [ ] Initialize a new Expo / React Native project (`npx create-expo-app guardian-app`).
- [ ] Initialize frontend routing (React Navigation).
- [ ] Initialize a backend Node.js repository (`mkdir backend`, `npm init -y`, `npm i express mongoose cors dotenv`).

### 2. Map Implementation
- [ ] Acquire Mapbox API keys.
- [ ] Create a core `MapScreen` component in the app.
- [ ] Implement the Mapbox viewport and handle user geolocation permissions.

### 3. Mock Data Generation
- [ ] Write a script (`seed.js`) to generate mock "Threat Zones" (e.g., broken lights, harassment reports) and "Safe Zones" (police stations) around a specific testing coordinate.
- [ ] Push mock data to MongoDB.

### 4. Algorithm Development
- [ ] Create the routing utility function that takes Start Coordinate, End Coordinate, and queries the Mapbox Directions API for multiple routes.
- [ ] Implement the Python/Node helper that compares these route coordinates against the Threat/Safe zone datasets.

### 5. UI Elements
- [ ] Build the "Safe Space" floating action button.
- [ ] Build the camera integration for the Civic Reporting flow.
- [ ] Build the Panic Button slider.

> [!IMPORTANT]
> Always mark off these tasks as you complete them to maintain organization during the sprint. Do not jump to Phase 4 before Phase 1 and 2 are fully tested.

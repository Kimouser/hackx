# 24-Hour Development Roadmap

This roadmap is optimized for a hackathon environment, focusing on delivering a high-impact MVP (Minimum Viable Product).

## Phase 1: Setup & Core Foundations (Hours 0-4)
- **Hour 0-1**: Repository initialization, CI/CD setup, database provisioning (MongoDB Atlas).
- **Hour 1-2**: Mobile app skeleton generation (Expo/React Native). Implement basic navigation and UI theme (Dark mode, neon safety accents).
- **Hour 2-4**: LeafletJS integration. Successfully render a map centered on the user's location with basic markers.

## Phase 2: The "Safety First" Engine (Hours 4-10)
- **Hour 4-6**: Integrate Leaflet Routing Machine API. Pull 2-3 standard routes between points.
- **Hour 6-8**: Build the Safety Overlay logic. Create a mock dataset of "Threat Zones" and "Well-Lit Zones". 
- **Hour 8-10**: Implement the custom weighting algorithm to select and render the "Safest Route" prominently over the fastest route.

## Phase 3: Civic Accountability & Safe Spaces (Hours 10-16)
- **Hour 10-12**: "Safe Space Hotspots" integration. Use Google Places API or a custom seed database to drop pins for Hospitals and Police Stations. One-touch routing to these points.
- **Hour 12-14**: Build the Community Reporting Dashboard UI (camera integration, simple form for dropping a threat pin).
- **Hour 14-16**: Create the Priority Poll backend (Upvoting logic) and the automated "Municipal Loop" (Triggering a simulated email via SendGrid when a report hits 10 upvotes).

## Phase 4: Emergency Response & Hardware Simulation (Hours 16-20)
- **Hour 16-18**: Implement the in-app Panic Button and the Escalation logic (Status Check -> Contact Alert -> Police Alert).
- **Hour 18-20**: **Hardware Simulation**. Since building physical hardware during a hackathon is risky, build a simple script or secondary web interface that acts as the "Bracelet Tracker" via BLE simulation or a simple HTTP webhook to trigger the mobile app's panic sequence. Define the body-guard network data structure.

## Phase 5: Polish & Pitch Preparation (Hours 20-24)
- **Hour 20-22**: UI/UX Polish. Ensure the map looks premium, transitions are smooth, and the "Safety routes" are visually distinct (e.g., glowing green paths).
- **Hour 22-24**: Record the demo video, finalize the pitch deck (`pitch_deck.md`), and write the final submission text.

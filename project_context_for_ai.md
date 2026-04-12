# Project Guardian: Comprehensive Context for Presentation Generation

*This document contains all the project documentation, architecture details, and vision for "Project Guardian". Please use this entire context to generate a compelling PowerPoint presentation or pitch deck.*

---

## Part 1: Product Vision & Idea
**Project Name:** Project Guardian
**Tagline:** AI-Powered Safe-Passage & Civic Accountability

### The Vision
A specialized mapping application that prioritizes female safety over travel time. While traditional maps (e.g., Google Maps) focus on the shortest or fastest path, Project Guardian calculates the safest route based on lighting density, foot traffic, historical crime data, and real-time community reports.

### Technical Approach
- **Single Expo App**: Cross-platform (Web + iOS + Android) with no backend dependency.
- **Local-First Database**: SQLite via expo-sqlite — works offline, auto-seeds on first launch.
- **LeafletJS Mapping**: Custom dark-themed map with safety overlays (threat zones, safe paths, safe spaces).

### Core Features
1. **The Safety-First Map**
   - **Dynamic Routing Engine**: A navigation tool that plots the safest route for women at night.
   - **Safe Paths**: Glowing green lines on the map connecting well-lit, high-activity safe zones.
   - **Threat Zones**: Red pulsing circles showing crowdsourced danger areas.

2. **Verified Safe Space Hotspots**
   - **One-Touch Navigation**: A dedicated button on the map that instantly displays nearby safe zones.
   - **Categories Include**: Hospitals/Medical Shops (🏥), Police (👮), 24/7 Cafes (☕), Pharmacies (💊), Shelters (🏠).

3. **Community Vigilance & Civic Action**
   - **Reporting Dashboard**: Users report issues (eve-teasing spots, broken streetlights) by dropping a pin.
   - **The Priority Poll**: Upvoting system to prevent spam and highlight critical threats.
   - **Offline Mode**: All reports stored locally via SQLite.

4. **The "Municipal Loop" (Automated Accountability)**
   - **Escalating Alerts**: Top-voted issues (10+ upvotes) auto-generate a formatted email to the Municipal Corporation.

5. **Emergency Response System**
   - **Panic Button (Guardian Bracelet Simulation)**: Long-press triggers haptic feedback, notifies emergency contacts, starts GPS tracking, and a 5-minute police escalation timer.

### The Revenue Model: The Guardian Bracelet
A premium hardware accessory that acts as a silent alarm and safety companion using a capacitive touch sensor. It transmits live GPS via BLE.

---

## Part 2: Technical Architecture

### Frontend (Mobile + Web Application)
- **Framework**: Expo (React Native) — single codebase for iOS, Android, and Web.
- **Mapping Library**: **LeafletJS** rendered via WebView/iframe. Uses CARTO dark basemap tiles.
- **Styling**: NativeWind (Tailwind CSS for React Native) with custom dark/neon theme.
- **State Management**: React hooks + local component state.
- **Navigation**: React Navigation (Stack + Bottom Tab).

### Database (Local-First)
- **Engine**: SQLite via `expo-sqlite`.
- **Schema**:
  - `reports`: User-submitted threat reports.
  - `safe_zones`: Verified safe locations.
  - `emergency_logs`: Panic button trigger history.

### The "Safety First" Algorithm
A visual safety overlay:
1. **Threat Layer**: Red pulsing circles (sized by upvote count).
2. **Safe Zone Layer**: Emoji markers.
3. **Safe Path Layer**: Glowing green polylines connecting safe zones.

---

## Part 3: Project Status & Execution Plan

- **Phase 1: Scaffolding (COMPLETE)**
  - Initialized Expo project with NativeWind, expo-sqlite.
  - Set up SQLite schema and seeding data (10 Ahmedabad threat reports + 10 safe zones).

- **Phase 2: Core Map (COMPLETE)**
  - Built LeafletMap with CARTO dark tiles. Rendered threat zones, safe zones, and safe paths.

- **Phase 3: Civic Reporting (COMPLETE)**
  - Built ReportScreen and DashboardScreen with Priority Poll (upvoting). Auto-trigger municipal loop at 10 upvotes.

- **Phase 4: Emergency System (COMPLETE)**
  - Built PanicButton with long-press, haptic feedback, and mock police escalation timer.

- **Phase 5: Polish & Demo Prep (IN PROGRESS)**
  - Testing on Web + Mobile. Preparing pitch deck and demo walkthrough.

---

## Part 4: Starter Pitch Deck Outline
*Note to AI generating the PPT: Below is a preliminary outline for the deck to use as a structural foundation.*

1. **Title Screen**: Project Guardian - AI-Powered Safe-Passage & Civic Accountability.
2. **The Problem**: Traditional maps prioritize speed over human safety.
3. **The Solution (Safety First Engine)**: A navigation UI flipping the paradigm: Safety over Speed via lighting/active business logic.
4. **Real-Time Safe Spaces**: One-touch access to 24/7 hotspots in distress.
5. **Civic Accountability (The Municipal Loop)**: Automating email reports to local government when threats reach 10+ upvotes.
6. **The Emergency Ecosystem (Software + Hardware)**: The Guardian Bracelet triggering silent checks.
7. **Technical Architecture**: React Native, SQLite, LeafletJS, offline-first approach.
8. **What's Next & The Ask**: Partnerships, API integrations, hardware prototyping. "Empowering communities to reclaim the night."

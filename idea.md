# Project Guardian: AI-Powered Safe-Passage & Civic Accountability

## The Vision
A specialized mapping application that prioritizes female safety over travel time. While traditional maps (e.g., Google Maps) focus on the shortest or fastest path, Project Guardian calculates the safest route based on lighting density, foot traffic, historical crime data, and real-time community reports.

## Technical Approach
- **Single Expo App**: Cross-platform (Web + iOS + Android) with no backend dependency.
- **Local-First Database**: SQLite via expo-sqlite — works offline, auto-seeds on first launch.
- **LeafletJS Mapping**: Custom dark-themed map with safety overlays (threat zones, safe paths, safe spaces).

## Core Features

### 1. The Safety-First Map
- **Dynamic Routing Engine**: A navigation tool that plots the safest route for women at night.
- **Safe Paths**: Glowing green lines on the map connecting well-lit, high-activity safe zones.
- **Threat Zones**: Red pulsing circles showing crowdsourced danger areas.

### 2. Verified Safe Space Hotspots
- **One-Touch Navigation**: A dedicated button on the map that instantly displays nearby safe zones.
- **Categories Include**:
  - Hospitals and Medical Shops (🏥)
  - Police Stations (👮)
  - 24/7 Public Hotspots — cafes, gas stations (☕)
  - Pharmacies (💊)
  - Women's Shelters (🏠)

### 3. Community Vigilance & Civic Action
- **Reporting Dashboard**: Users report issues (eve-teasing spots, broken streetlights, unresponsive police) by dropping a pin and selecting a category.
- **The Priority Poll**: Every reported issue appears on a community dashboard for "Upvoting". This prevents spam and highlights the most critical threats.
- **Local SQLite Storage**: All reports stored locally — no cloud dependency.

### 4. The "Municipal Loop" (Automated Accountability)
- **Escalating Alerts**: Top-voted issues (10+ upvotes) auto-generate a formatted email to the Municipal Corporation.
- **Demo Mode**: Email is logged to console and shown as a UI confirmation.
- **Production Mode**: Would use Nodemailer/SendGrid for real delivery.

### 5. Emergency Response System
- **Panic Button (Guardian Bracelet Simulation)**: Long-press SOS button triggers:
  1. Haptic feedback / vibration
  2. Emergency contact notification (mock)
  3. GPS tracking activation (mock)
  4. 5-minute police escalation timer
- **Production Hardware**: The Guardian Bracelet — a BLE wearable with capacitive touch sensor.

## The Revenue Model: The Guardian Bracelet
A premium hardware accessory that acts as a silent alarm and safety companion.
- **Capacitive Touch Sensor**: Discrete validation.
- **Trigger**: When tapped, sends an emergency "check-up" notification to designated contacts.
- **Escalation**: If contacts don't confirm safety within the timeframe, system alerts police.
- **Live Tracking**: Transmits GPS location via phone's Bluetooth connection.

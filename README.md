# Project Guardian 🛡️

**AI-Powered Safe-Passage & Civic Accountability**

Project Guardian is a specialized mapping application that prioritizes female safety over travel time. While traditional GPS focuses on the shortest path, Project Guardian calculates the safest route based on lighting density, active public hotspots, and real-time community data.

## 📚 Documentation Navigation
For a comprehensive breakdown of this project, please refer to the following documents:

1. [idea.md](./idea.md) - The core vision, features, and revenue model.
2. [architecture.md](./architecture.md) - Tech stack and algorithm design.
3. [pitch_deck.md](./pitch_deck.md) - The structure of the hackathon pitch.
4. [roadmap.md](./roadmap.md) - The 24-hour sprint schedule.
5. [plan.md](./plan.md) - The granular task list for developers.
6. [agents.md](./agents.md) - Instructions for AI agents working in this repository.

## 🗂️ Project Structure & Modular Architecture

The repository is divided into two primary directories: the mobile frontend (`guardian-app`) and the server backend (`backend`).

```text
hackx/
├── backend/                       # Node.js, Express, MongoDB
│   ├── src/
│   │   ├── config/                # Database, environment, and external API configurations
│   │   ├── controllers/           # HTTP request handlers for different routes
│   │   ├── models/                # Mongoose database schemas (e.g., User, Report, Zone)
│   │   ├── routes/                # Express route definitions mapped to controllers
│   │   ├── services/              # Core business logic isolated into modules
│   │   │   ├── mapService.js      # Map Logic: safe-routing algorithms, Mapbox API wrapper
│   │   │   ├── authService.js     # Auth Logic: JWT token generation, password hashing
│   │   │   ├── civicService.js    # Civic Reporting: upvoting logic, the "Municipal Loop" (Nodemailer/SendGrid)
│   │   │   └── hardwareService.js # Mock integrations for the Guardian Bracelet hardware
│   │   ├── utils/                 # General helpers (loggers, error formatting, etc.)
│   │   └── app.js                 # Express app initialization
│   ├── package.json
│   └── .env                       # Environment variables (DB URI, Mapbox key, etc.)
│
├── guardian-app/                  # React Native mobile app (Expo + NativeWind)
│   ├── src/
│   │   ├── assets/                # Local images, fonts (neon/dark theme assets)
│   │   ├── components/            # Reusable UI elements (PanicButton, ThreatCard, etc.)
│   │   ├── navigation/            # React Navigation setups (Tab & Stack navigators)
│   │   ├── screens/               # Main app views
│   │   │   ├── MapScreen.jsx      # Core map interface w/ Mapbox
│   │   │   ├── ReportScreen.jsx   # Reporting form and civic UI
│   │   │   ├── AuthScreen.jsx     # Login / Registration
│   │   │   └── DashboardScreen.jsx# Priority poll and community updates
│   │   ├── services/              # API wrappers speaking to our backend
│   │   │   ├── mapApi.js          # Fetching routes & threat zones
│   │   │   ├── authApi.js         # Performing login/signup requests
│   │   │   └── civicApi.js        # Post threats, vote on priority polls
│   │   ├── theme/                 # Styling tokens, colors (dark mode, green safepaths)
│   │   └── utils/                 # Client helpers (geolocation perm handlers)
│   ├── app.config.js              # Expo config
│   ├── tailwind.config.js         # NativeWind configuration
│   └── package.json
│
├── idea.md                        # Product vision and context
├── architecture.md                # System diagrams and tech choices
├── roadmap.md                     # Hackathon execution 24h phase guide
├── plan.md                        # Task checklist
├── agents.md                      # Instructions for AI agents
└── README.md                      # This file
```

## 🏗️ Architecture Modules

### 🗺️ Map Logic Service
- **Backend (`backend/src/services/mapService.js`)**: Interfaces with Mapbox Directions API, queries the MongoDB for Threat/Safe zones, and evaluates the safest path algorithm (higher weight for well-lit/active areas).
- **Frontend (`guardian-app/src/screens/MapScreen.jsx` & `services/mapApi.js`)**: Consumes map tiles and distinctively draws optimal routes (e.g., strong glowing green lines for safe paths, warnings for threat zones) using NativeWind theming.

### 🔐 Auth Service
- **Backend (`backend/src/services/authService.js`)**: Encrypts passwords, manages user sessions securely using JWT tokens.
- **Frontend (`guardian-app/src/screens/AuthScreen.jsx` & `services/authApi.js`)**: Handles user authentication flow, secure token storage, and persistent logins.

### 🏛️ Civic Reporting Service
- **Backend (`backend/src/services/civicService.js`)**: Implements the Priority Poll (upvoting system on civic threats) and automates the **"Municipal Loop"**. Automatically formats and sends an email via SendGrid/Nodemailer when a particular threat hits 10 upvotes.
- **Frontend (`guardian-app/src/screens/ReportScreen.jsx` & `services/civicApi.js`)**: Provides an intuitive UI using the device camera for dropping pins on non-functioning lights or harassment zones, along with a dashboard feed to upvote nearby reports.

## 🚀 Quick Start
*(Implementation pending - see `roadmap.md` Phase 1)*

## 💡 The "Safety-First" Approach
We believe navigation should adapt to human realities. By crowdsourcing threat reports, automating municipal accountability, and integrating with discrete hardware (The Guardian Bracelet), we are building a proactive safety ecosystem, not just a reactive panic button.

---
*Built during [Hackathon Name/Date]*

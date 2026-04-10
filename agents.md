# Instructions for Agentic AI (AI Agents)

Welcome to the **Project Guardian** repository. If you are an AI assistant tasked with writing code, generating assets, or organizing this repository, you MUST adhere strictly to the following rules to ensure rapid progress during the hackathon.

## 1. Context First
Always read the following files before making architectural decisions or creating new features:
- `idea.md`: For product vision and feature context.
- `architecture.md`: For the required tech stack and system diagrams.
- `plan.md`: For specific to-do lists and immediate execution tasks.

## 2. Tech Stack Mandates
- **Frontend**: ALWAYS use React Native / Expo for the mobile + web app interface.
- **Mapping**: Use LeafletJS. Do NOT default to Google Maps or Mapbox unless LeafletJS fails or is explicitly overridden. The custom styling and routing features of LeafletJS are essential for the "Safety Overlay".
- **Database**: Use **SQLite via expo-sqlite** for local-first storage. No cloud database dependencies (no MongoDB Atlas, no Firebase). Everything runs offline.
- **UI/UX**: Prioritize aesthetic, premium designs using **NativeWind (Tailwind CSS)**. Use distinct visual cues (e.g., green glowing lines for safe routes, red circles for threats). Dark theme mandatory.
- **Cross-Platform**: All code must work on Web + iOS + Android via Expo. Use `Platform.OS` checks where needed.

## 3. Architecture: Single App (No Backend)
- This project runs as a **single Expo application** — there is no separate backend server.
- All data is stored locally in SQLite. The database is auto-seeded on first launch.
- The **Municipal Loop** email system is mocked (logs to console + shows UI confirmation).
- The **Guardian Bracelet** is simulated via an in-app SOS button.

## 4. Automation Philosophy
- When building the **Municipal Loop**, write actual working mock code that logs a formatted email to console. Do not just leave `TODO` comments.
- Treat hardware simulation (The Guardian Bracelet) as a UI component. Create a PanicButton that triggers a visible escalation sequence.

## 5. Key File Locations
```
guardian-app/
├── App.js                         # Entry point, DB initialization
├── src/db/database.js             # SQLite schema + CRUD operations
├── src/db/seed.js                 # Auto-seed with Ahmedabad data
├── src/components/LeafletMap.jsx  # Cross-platform Leaflet map
├── src/components/PanicButton.jsx # SOS / Guardian Bracelet simulation
├── src/screens/MapScreen.jsx      # Main map with safety overlay
├── src/screens/ReportScreen.jsx   # Threat reporting form
├── src/screens/DashboardScreen.jsx# Priority poll / community feed
├── src/services/municipalService.js # Mock email service
└── src/theme/colors.js            # Dark/neon color tokens
```

## 6. Communication & Artifacts
- Create Markdown artifacts for complex plans.
- Always run code formatting before finalizing files.
- If you run into a dependency issue with LeafletJS/React Native, quickly search for workarounds or downgrade to stable versions rather than getting stuck for hours. Time is of the essence.

## 7. Focus Areas
Your primary value add is speed. Scaffolding, boilerplate, and UI components should be generated as quickly as possible so the human developers can focus on tweaking the "Safety-First" routing algorithm.

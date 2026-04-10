# Project Guardian: Hackathon Execution Plan

## Architecture: Single Expo App with Local SQLite

### Phase 1: Scaffolding (COMPLETE)
- [x] Initialize Expo project with NativeWind, React Navigation, expo-sqlite
- [x] Set up dark/neon theme (colors.js, tailwind.config.js)
- [x] Create SQLite schema (reports, safe_zones, emergency_logs)
- [x] Write seed.js with 10 Ahmedabad threat reports + 10 safe zones
- [x] Set up Stack + Tab navigation

### Phase 2: Core Map (COMPLETE)
- [x] Build cross-platform LeafletMap component (WebView mobile, iframe web)
- [x] Implement CARTO dark basemap tiles
- [x] Render threat zones as red pulsing circles (sized by upvotes)
- [x] Render safe zones with emoji markers (🏥 👮 ☕ 💊 🏠)
- [x] Draw "Safe Paths" as glowing green polylines
- [x] Add legend bar with toggle controls

### Phase 3: Civic Reporting (COMPLETE)
- [x] Build ReportScreen with category/severity selectors
- [x] Save reports to local SQLite database
- [x] Build DashboardScreen with Priority Poll (upvoting)
- [x] Implement Municipal Loop mock email (console log + UI alert)
- [x] Auto-trigger municipal email at 10 upvotes threshold

### Phase 4: Emergency System (COMPLETE)
- [x] Build PanicButton with long-press activation
- [x] Implement escalation sequence (contacts → GPS → police timer)
- [x] Add haptic feedback and animated pulse ring
- [x] Log emergencies to SQLite

### Phase 5: Polish & Demo Prep
- [ ] Test full flow on web browser (presentation mode)
- [ ] Test on mobile via Expo Go
- [ ] Add more mock safe paths for demo
- [ ] Fine-tune map popup styling
- [ ] Prepare pitch deck demo walkthrough

> [!IMPORTANT]
> The app runs with a single command: `cd guardian-app && npm install && npx expo start --web`
> No backend, no cloud database, no API keys required.

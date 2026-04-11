# Project Guardian

**AI-Powered Safe-Passage & Civic Accountability**

A specialized mapping application that prioritizes female safety over travel time. Crowdsourced threat reports, automated municipal accountability, and a Guardian Bracelet SOS system — all in a single cross-platform app.

---

## One-Command Start

```bash
cd guardian-app && npm install && npx expo start --web
```

That's it. No backend server, no database setup, no API keys. Opens in your browser.

---

## Quick Start (Detailed)

### Prerequisites

| Tool | Install |
|------|---------|
| Node.js 18+ | [nodejs.org](https://nodejs.org) |
| Git | [git-scm.com](https://git-scm.com) |

### Step 1: Clone & Install

```bash
git clone https://github.com/your-username/hackx.git
cd hackx/guardian-app
npm install
```

### Step 2: Run

**Web (for presentations):**
```bash
npx expo start --web
```

**Mobile (via Expo Go):**
```bash
npx expo start
# Scan the QR code with Expo Go app on your phone
```

### What Happens on First Launch
1. SQLite database is created automatically
2. 10 threat reports + 10 safe zones are seeded (Ahmedabad landmarks)
3. The map loads centered on Ahmedabad with the full safety overlay

---

## Features

### Safety-First Map
- Dark-themed LeafletJS map with CARTO tiles
- **Red pulsing circles** = Threat zones (sized by community upvotes)
- **Emoji markers** = Safe zones (🏥 hospitals, 👮 police, ☕ 24/7 cafes, 💊 pharmacies, 🏠 shelters)
- **Glowing green lines** = Recommended safe walking paths

### Community Reporting
- Drop a pin to report threats (harassment, broken lights, unsafe areas)
- Reports saved to local SQLite database
- No account or cloud connection required

### Priority Poll (Dashboard)
- Community upvotes surface the most critical issues
- Stats bar shows total / active / escalated counts
- Pull-to-refresh for latest data

### Municipal Loop
- When a report hits **10 upvotes**, an automated municipal email is generated
- In demo mode: formatted email logged to browser console + UI confirmation shown
- In production: Nodemailer/SendGrid delivers real emails to authorities

### Guardian Bracelet (SOS)
- **Long-press** (800ms) the red SOS button on the map screen
- Triggers a 4-step escalation sequence:
  1. Haptic feedback + emergency log saved
  2. Emergency contacts notified (mock)
  3. GPS tracking started (mock)
  4. Police alert queued (5-min timer)

---

## Project Structure

```
guardian-app/
├── App.js                           # Entry point — DB init + splash screen
├── app.config.js                    # Expo configuration
├── babel.config.js                  # Babel + NativeWind preset
├── metro.config.js                  # Metro + NativeWind integration
├── tailwind.config.js               # Tailwind theme (dark/neon colors)
├── global.css                       # Tailwind directives
├── package.json                     # All dependencies
│
├── src/
│   ├── db/
│   │   ├── database.js              # SQLite schema + CRUD operations
│   │   └── seed.js                  # Auto-seed: 10 threats + 10 safe zones
│   │
│   ├── components/
│   │   ├── LeafletMap.jsx           # Cross-platform Leaflet (WebView/iframe)
│   │   ├── PanicButton.jsx          # SOS button with escalation flow
│   │   └── ThreatCard.jsx           # Report card for Dashboard
│   │
│   ├── screens/
│   │   ├── MapScreen.jsx            # Main map with safety overlay
│   │   ├── ReportScreen.jsx         # Threat reporting form
│   │   ├── DashboardScreen.jsx      # Priority poll + community feed
│   │   └── AuthScreen.jsx           # Login/register (skip for demo)
│   │
│   ├── navigation/
│   │   ├── AppNavigator.jsx         # Stack: Auth → Main
│   │   └── TabNavigator.jsx         # Tabs: Map, Report, Dashboard
│   │
│   ├── services/
│   │   └── municipalService.js      # Mock email service (console log)
│   │
│   ├── theme/
│   │   └── colors.js                # Color tokens
│   │
│   └── utils/
│       └── location.js              # Expo Location helpers
│
├── backend/                         # (Legacy — not required for demo)
│   └── ...                          # Express + MongoDB (for production)
│
├── idea.md                          # Product vision
├── architecture.md                  # Technical architecture
├── plan.md                          # Task checklist
├── agents.md                        # AI agent instructions
└── README.md                        # This file
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| App Framework | Expo (React Native) — Web + iOS + Android |
| Mapping | LeafletJS + CARTO dark tiles |
| Database | SQLite (expo-sqlite) — local, offline-first |
| Styling | NativeWind (Tailwind CSS) |
| Navigation | React Navigation (Stack + Tabs) |
| Municipal Loop | Mock Nodemailer (console log) |
| SOS System | PanicButton component (Guardian Bracelet sim) |

## Documentation

| File | Contents |
|------|----------|
| [idea.md](./idea.md) | Product vision, features, revenue model |
| [architecture.md](./architecture.md) | Tech stack, database schema, algorithms |
| [plan.md](./plan.md) | Hackathon task checklist |
| [agents.md](./agents.md) | Instructions for AI coding agents |

---

*Built during HackX Hackathon*

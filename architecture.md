# Technical Architecture

## Overview
Project Guardian is a cross-platform (Web + Mobile) safety mapping application built as a single Expo app with local-first data storage. No cloud infrastructure required — runs entirely offline.

## Frontend (Mobile + Web Application)
- **Framework**: Expo (React Native) — single codebase for iOS, Android, and Web.
- **Mapping Library**: **LeafletJS** rendered via WebView (mobile) and iframe (web). Uses CARTO dark basemap tiles for the premium dark theme.
- **Styling**: NativeWind (Tailwind CSS for React Native) with a custom dark/neon theme.
- **State Management**: React hooks + local component state (lightweight for hackathon).
- **Navigation**: React Navigation — Stack navigator (Auth → Main) + Bottom Tab navigator (Map, Report, Dashboard).

## Database (Local-First)
- **Engine**: SQLite via `expo-sqlite` — runs natively on iOS/Android and via SQL.js (WASM) on web.
- **Schema**:
  - `reports` — User-submitted threat reports (harassment, broken lights, unsafe areas) with upvote tracking and municipal escalation status.
  - `safe_zones` — Verified safe locations (hospitals, police stations, 24/7 hotspots, pharmacies, shelters).
  - `emergency_logs` — Panic button trigger history.
- **Seed Data**: Auto-populated on first launch with 10 threat reports and 10 safe zones centered on Ahmedabad (23.0225°N, 72.5714°E).

## The "Safety First" Algorithm
A visual safety overlay built on top of LeafletJS:
1. **Threat Layer**: Red pulsing circles sized by upvote count. Categories: harassment, broken lights, unsafe areas, unresponsive police.
2. **Safe Zone Layer**: Emoji markers for hospitals (🏥), police (👮), pharmacies (💊), cafes (☕), shelters (🏠).
3. **Safe Path Layer**: Glowing green polylines connecting safe zone clusters — representing recommended walking routes.

## The Municipal Loop (Mock Email Service)
- When a threat report reaches 10+ community upvotes, the system auto-generates a formatted municipal email.
- In the hackathon demo, this email is logged to the console and a UI confirmation is shown.
- In production, this would use Nodemailer/SendGrid to send real emails to municipal authorities.

## IoT Hardware Integration (Guardian Bracelet — Simulated)
- **In-App Simulation**: A PanicButton component with long-press activation.
- **Escalation Flow**: Haptic feedback → Log to SQLite → Notify contacts (mock) → GPS tracking (mock) → 5-min police alert timer.
- **Production Path**: ESP32/nRF52 BLE peripheral → React Native BLE Central → same escalation flow.

## Deployment
- **Hackathon Demo**: `npx expo start --web` — runs in any browser.
- **Mobile Testing**: Expo Go app on physical device (scan QR code).
- **Production**: EAS Build for app store distribution.

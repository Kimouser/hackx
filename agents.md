# Instructions for Agentic AI (AI Agents)

Welcome to the **Project Guardian** repository. If you are an AI assistant tasked with writing code, generating assets, or organizing this repository, you MUST adhere strictly to the following rules to ensure rapid progress during the hackathon.

## 1. Context First
Always read the following files before making architectural decisions or creating new features:
- `idea.md`: For product vision and feature context.
- `architecture.md`: For the required tech stack and system diagrams.
- `roadmap.md`: To understand the current phase of development.
- `plan.md`: For specific to-do lists and immediate execution tasks.

## 2. Tech Stack Mandates
- **Frontend**: ALWAYS use React Native or Expo for the mobile app interface unless specified otherwise.
- **Mapping**: Use Mapbox. Do NOT default to Google Maps or Leaflet unless Mapbox fails or is explicitly overridden. The custom styling and routing features of Mapbox are essential for the "Safety Overlay".
- **Backend**: Node.js/Express with MongoDB. 
- **UI/UX**: Prioritize aesthetic, premium designs. Use distinct visual cues (e.g., green glowing lines for safe routes, red for threats).

## 3. Automation Philosophy
- When building the **Municipal Loop**, write actual working code (using Nodemailer, SendGrid, or similar) to send mock emails. Do not just leave `TODO` comments.
- Treat hardware simulation (The Guardian Bracelet) as an API endpoint. Create a script that can ping this endpoint to simulate a user tapping the capacitive sensor.

## 4. Communication & Artifacts
- Create Markdown artifacts for complex plans.
- Always run code formatting before finalizing files.
- If you run into a dependency issue with Mapbox/React Native, quickly search for workarounds or downgrade to stable versions rather than getting stuck for hours. Time is of the essence.

## 5. Focus Areas
Your primary value add is speed. Scaffolding, boilerplate, and boilerplate API routes should be generated as quickly as possible so the human developers can focus on tweaking the "Safety-First" routing algorithm.

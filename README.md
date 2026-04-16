# CLIC Frontend Workspace

This repository contains the frontend applications and shared libraries for the **CLIC (Computer Literacy Integrated into the Curriculum)** initiative, developed by the **Transformative Learning Technologies Lab (TLTL) at Columbia University**.

CLIC aims to integrate computing into the regular school curriculum (especially in Humanities) by allowing teachers and students to create computational artifacts like chatbots and dynamic visualizations without prior programming knowledge.

## Architecture
This is a **Monorepo** managed with **npm workspaces**, designed for modularity and shared logic.

- **`apps/`**: Individual Single Page Applications (SPAs).
  - `chatbot`: A visual editor for creating pedagogical conversational flows.
  - `graph-builder`: A tool for categorizing information and visualizing it as interactive graphs.
- **`packages/shared`**: Core logic and shared resources.
  - Contains global UI components, WordPress API integrations, telemetry plugins, and shared TypeScript types.

## Tech Stack
- **Framework:** Vue 3 (Composition API)
- **State Management:** Pinia (with custom State-Diffing telemetry)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Architecture:** Headless CMS (WordPress as Backend)

## Getting Started

### Prerequisites
- **Node.js:** v20 or higher
- **npm:** v9 or higher

### Installation
From the root directory:
```bash
npm run install:all
```

### Development
To run a specific application in development mode:
```bash
npm run dev:chatbot    # Runs Chatbot editor
npm run dev:graph      # Runs Graph Builder editor
```

### Build
To build all applications for production:
```bash
npm run build:all
```

## Staging & Deployment

### Staging (GitHub Pages)
We use GitHub Actions to automatically deploy a unified staging environment. Every push to `main` builds all apps and generates a landing page for validation.
**Live Demo:** [https://clictltl.github.io/clic-frontend-workspace/](https://clictltl.github.io/clic-frontend-workspace/)

### Production (WordPress)
The production builds are optimized for WordPress integration. After running the build, the `dist` folders are packaged into their respective WordPress plugins (`clic-chatbot`, `clic-graph-builder`, etc.).

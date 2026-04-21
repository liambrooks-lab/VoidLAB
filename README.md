<p align="center">
  <img src="apps/web/public/assets/logo-full.svg" alt="VoidLAB logo" width="280" />
</p>

<p align="center">
  AI-powered web IDE with multi-language execution, inline stdin handling, GitHub publishing, collaboration tools, and a premium workspace experience.
</p>

<p align="center">
  <a href="https://void-lab-web.vercel.app/">Live Product</a>
  |
  <a href="https://voidlab.onrender.com">Backend API</a>
  |
  <a href="https://github.com/liambrooks-lab/VoidLAB">Repository</a>
</p>

---

## Overview

VoidLAB is a modern cloud coding environment designed to feel like a real product, not just a code editor in the browser. It combines a Monaco-powered workspace, multi-file editing, online code execution, inline input handling for interactive programs, collaboration-ready tools, GitHub publishing, and a polished high-end interface.

The project is organized as a monorepo with:

- a `Next.js` frontend for the full product experience
- an `Express` API for execution, auth, and integration flows
- shared configuration packages for scalable development

---

## Core Highlights

- Monaco-powered editor with multi-file workspace management
- support for many runnable and editor-focused languages
- inline stdin capture for interactive code execution
- unified output, terminal, and ports console
- direct GitHub publishing workflow from the workspace
- collaboration room interface for team workflows
- built-in AI guide for product walkthroughs and debugging help
- polished theme system with dark and light workspace modes
- responsive layout tuned for desktop and mobile

---

## Demo Gallery

### 1. Personalized workspace home

![VoidLAB personalized workspace](docs/readme/demo-workspace-home.png)

The main workspace gives users a premium first impression with a personalized greeting, feature hub, language card, file explorer, active code editor, and one-click run workflow.

### 2. Execution and command workflow

![VoidLAB execution workflow](docs/readme/demo-terminal-legacy.png)

This view shows the execution area, command workflow, workspace shortcuts, and output-focused development flow that powers the coding experience inside VoidLAB.

### 3. Collaboration rooms

![VoidLAB collaboration rooms](docs/readme/demo-collaboration.png)

VoidLAB includes a dedicated collaboration interface for creating rooms, inviting teammates, syncing shared workspace state, and preparing live teamwork features.

### 4. GitHub publishing

![VoidLAB GitHub publishing](docs/readme/demo-github-publishing.png)

The GitHub publishing page lets users connect GitHub, review the active file, choose a repository target, and prepare code for direct publishing from inside the product.

### 5. Built-in AI guide

![VoidLAB AI guide](docs/readme/demo-ai-guide.png)

The AI guide helps users with input-output handling, workspace structure, debugging direction, and onboarding support without leaving the platform.

---

## Language Support

Runnable language examples:

- JavaScript
- TypeScript
- Python
- Java
- C
- C++
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- Bash
- Lua
- C#

Editor-oriented formats include:

- HTML
- CSS
- JSON
- Markdown
- YAML
- SQL
- XML
- PowerShell

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Monaco Editor
- Lucide Icons

### Backend

- Node.js
- Express
- TypeScript
- Axios
- PostgreSQL

### Platform and deployment

- Vercel for frontend hosting
- Render for backend hosting
- Judge0 CE for cloud code execution

### Monorepo tooling

- npm workspaces
- Turborepo
- shared TypeScript configs

---

## Monorepo Structure

```text
VoidLAB/
|- apps/
|  |- api/
|  |  |- src/
|  |  |  |- controllers/
|  |  |  |- middleware/
|  |  |  |- models/
|  |  |  |- routes/
|  |  |  `- index.ts
|  |  |- package.json
|  |  `- tsconfig.json
|  `- web/
|     |- public/
|     |- src/
|     |  |- app/
|     |  |- components/
|     |  |- context/
|     |  |- hooks/
|     |  `- lib/
|     |- package.json
|     `- tsconfig.json
|- docs/
|  `- readme/
|- packages/
|  |- config/
|  `- tsconfig/
|- docker-compose.yml
|- package.json
|- package-lock.json
|- turbo.json
`- README.md
```

---

## Architecture

### Frontend responsibilities

- onboarding and direct entry experience
- profile and workspace personalization
- file management and editor interactions
- console, output, and terminal presentation
- GitHub publishing UI
- collaboration and AI tool pages
- communication with the backend API

### Backend responsibilities

- execution endpoints
- Judge0 submission and polling flow
- auth and session support
- database-backed user handling
- runtime and compiler output normalization
- GitHub repository and push flows

### Execution flow

1. User opens VoidLAB.
2. User writes code or imports files into the workspace.
3. User clicks `Run`.
4. If the program expects input, VoidLAB asks for stdin inline in the output area.
5. The backend forwards the execution payload to Judge0 CE.
6. VoidLAB returns normalized output, errors, and status details back to the workspace.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 10+
- PostgreSQL 15+ or Docker

### Install dependencies

```bash
npm install
```

### Start local PostgreSQL

```bash
docker-compose up -d postgres
```

### Backend environment

Create `apps/api/.env`:

```env
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000
WEB_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voidlab
DATABASE_SSL=false
DATABASE_SSL_REJECT_UNAUTHORIZED=false
JUDGE0_API_URL=https://ce.judge0.com
JWT_SECRET=replace_me
APP_ENCRYPTION_KEY=replace_me
GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me
GITHUB_CLIENT_ID=replace_me
GITHUB_CLIENT_SECRET=replace_me
X_CLIENT_ID=replace_me
X_CLIENT_SECRET=replace_me
```

### Frontend environment

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Run backend

```bash
npm run build -w api
npm run start -w api
```

### Run frontend

```bash
npm run dev -w web
```

### Local URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## Build Commands

### Build API

```bash
npm run build -w api
```

### Build web

```bash
npm run build -w web
```

---

## Deployment

### Frontend deployment

- hosted on `Vercel`
- root directory: `apps/web`

### Backend deployment

- hosted on `Render`
- uses the Express API from `apps/api`

### Required frontend production variable

```env
NEXT_PUBLIC_API_URL=https://voidlab.onrender.com
```

### Required backend production variables

```env
PORT=5000
NODE_ENV=production
API_BASE_URL=https://voidlab.onrender.com
WEB_APP_URL=https://void-lab-web.vercel.app
DATABASE_URL=your_postgres_connection_string
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
JUDGE0_API_URL=https://ce.judge0.com
JWT_SECRET=replace_me
APP_ENCRYPTION_KEY=replace_me
GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me
GITHUB_CLIENT_ID=replace_me
GITHUB_CLIENT_SECRET=replace_me
X_CLIENT_ID=replace_me
X_CLIENT_SECRET=replace_me
```

---

## Author

<p align="center">
  <img src="docs/readme/author-rudranarayan-jena.jpg" alt="Rudranarayan Jena" width="180" />
</p>

<p align="center">
  <strong>Crafted by MR. Rudranarayan Jena</strong>
</p>

<p align="center">
  Product Builder, Full-stack Developer, AI Enthusiast, and the creator behind VoidLAB.
</p>

<p align="center">
  Focused on building polished developer products, real-world web applications, and modern AI-assisted workflows.
</p>

<p align="center">
  <a href="https://github.com/liambrooks-lab">GitHub: @liambrooks-lab</a>
</p>

---


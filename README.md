# <img src="apps/web/public/assets/logo-icon.svg" alt="VoidLAB prism logo" width="30" valign="middle" /> VoidLAB

<p align="center">
  <strong>VoidLAB</strong><br />
  A premium cloud code editor and compiler built for fast iteration, polished UX, and modern developer workflows.
</p>

<p align="center">
  <a href="https://void-lab-web.vercel.app/">Live Product</a>
  •
  <a href="https://voidlab.onrender.com">Backend API</a>
  •
  <a href="https://github.com/liambrooks-lab/VoidLAB">Repository</a>
</p>

---

## Overview

VoidLAB is a full-stack cloud IDE experience designed to feel like a polished product rather than a rough demo. It combines a premium onboarding flow, personalized workspace, Monaco-powered editor, multi-file editing, keyboard shortcuts, online code execution, direct stdin support for interactive programs, and GitHub publishing from inside the workspace.

The project is structured as a monorepo and split into:

- a **Next.js frontend** for the product interface
- an **Express API** for execution, auth, and GitHub requests
- shared config packages for cleaner project organization

---

## Links

- **Live Product**: [https://void-lab-web.vercel.app/](https://void-lab-web.vercel.app/)
- **Backend API**: [https://voidlab.onrender.com](https://voidlab.onrender.com)
- **GitHub Repository**: [https://github.com/liambrooks-lab/VoidLAB](https://github.com/liambrooks-lab/VoidLAB)

---

## Highlights

### Premium Product Experience
- polished landing and onboarding flow
- profile-based workspace greeting
- responsive interface across desktop and mobile
- theme switching support
- product-grade layout and visual hierarchy

### Editor Experience
- Monaco-powered code editor
- multi-file project workspace
- file explorer and editor tabs
- export current file
- persistent local workspace state
- built-in user manual inside the editor

### Productivity Features
- `Ctrl/Cmd + Enter` to run code
- `Ctrl/Cmd + S` to save workspace locally
- `Ctrl/Cmd + Shift + N` to create a new file
- `Esc` to close mobile panels
- separate `Input (stdin)` area for interactive programs

### Authentication and GitHub
- direct "Enter VoidLAB" login without leaving the app
- optional Google, GitHub, and X login
- GitHub connect plus real push-to-repository support
- visible repository URL, branch, and visibility fields in the GitHub workspace

### Language Support
VoidLAB supports many languages and formats for editing, and a broad set of runnable languages through the execution engine.

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

### Platform and Deployment
- Vercel for frontend hosting
- Render for backend hosting
- Judge0 CE for cloud code execution

### Monorepo Tooling
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
|- packages/
|  |- config/
|  `- tsconfig/
|- .github/
|- docker-compose.yml
|- package.json
|- package-lock.json
|- turbo.json
`- README.md
```

## Architecture

### Frontend
The frontend is responsible for:
- onboarding and direct entry
- optional OAuth starts
- workspace rendering
- theme selection
- file management
- editor interactions
- terminal and output presentation
- GitHub publishing UI
- API communication with the backend

### Backend
The backend is responsible for:
- exposing execution endpoints
- forwarding execution requests to Judge0 CE
- handling auth and user sessions
- storing users and provider tokens
- returning compiler and runtime output to the frontend
- handling GitHub repository creation and file push

### Execution Flow
1. User opens VoidLAB
2. User enters directly or signs in with a provider
3. User enters the editor workspace
4. Code and stdin are sent to the backend
5. Backend forwards the request to Judge0 CE
6. Output is returned and shown in the terminal panel

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm 10+
- PostgreSQL 15+ or Docker

### Install

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

### Run Backend

```bash
npm run build -w api
npm run start -w api
```

### Run Frontend

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

### Build Web
```bash
npm run build -w web
```

---

## Deployment

### Frontend Deployment
- hosted on **Vercel**
- root directory: `apps/web`

### Backend Deployment
- hosted on **Render**
- uses the Express API from `apps/api`

### Required Frontend Production Variable
```env
NEXT_PUBLIC_API_URL=https://voidlab.onrender.com
```

### Required Backend Production Variables
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

## Key Capabilities

- polished onboarding and workspace personalization
- shareable public product URL
- cloud editor workflow
- stdin-based execution for interactive programs
- GitHub repository push support
- responsive design
- project tabs and file explorer
- professional UI suitable for demos and portfolio use
- clear repo structure for scaling the product further

---

## Current Scope

VoidLAB is built as a strong production-style MVP with:
- multi-language editing
- broad execution support
- a modern UI
- monorepo architecture
- real auth options
- GitHub publish flow
- live deployment links

---

## Author

Rudranarayan Jena

Github:

liambrooks-lab
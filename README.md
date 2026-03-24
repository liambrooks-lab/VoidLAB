# VoidLAB

<p align="center">
  <strong>VoidLAB</strong><br />
  A premium cloud code editor and compiler built for fast iteration, polished UX, and modern developer workflows.
</p>

<p align="center">
  <a href="https://void-lab-web.vercel.app/">Live Product</a>
  ·
  <a href="https://voidlab.onrender.com">Backend API</a>
  ·
  <a href="https://github.com/liambrooks-lab/VoidLAB">Repository</a>
</p>

---

## Overview

VoidLAB is a full-stack cloud IDE experience designed to feel like a polished product rather than a rough demo. It combines a premium onboarding flow, personalized workspace, Monaco-powered editor, multi-file editing, keyboard shortcuts, and online code execution through a remote compiler runtime.

The project is structured as a monorepo and split into:

- a **Next.js frontend** for the product interface
- an **Express API** for code execution requests
- shared config packages for cleaner project organization

---

## Live Links

- **Frontend**: [https://void-lab-web.vercel.app/](https://void-lab-web.vercel.app/)
- **Backend API**: [https://voidlab.onrender.com](https://voidlab.onrender.com)
- **GitHub Repository**: [https://github.com/liambrooks-lab/VoidLAB](https://github.com/liambrooks-lab/VoidLAB)

> The Vercel link is the main public product link to share with users, teammates, recruiters, or clients.

---

## Product Highlights

### Premium Product Experience
- Enterprise-style landing and onboarding flow
- Profile-based workspace greeting
- Smooth, responsive interface across desktop and mobile
- Theme switching support
- Product-grade layout and visual hierarchy

### Editor Experience
- Monaco-powered code editor
- Multi-file project workspace
- File explorer and editor tabs
- Export current file
- Persistent local workspace state
- Responsive editor shell

### Productivity Features
- `Ctrl/Cmd + Enter` to run code
- `Ctrl/Cmd + S` to save workspace locally
- `Ctrl/Cmd + Shift + N` to create a new file
- `Esc` to close mobile panels

### Language Support
VoidLAB supports **many languages and formats** for editing, and a broad set of **runnable languages** through the execution provider.

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
- PowerShell
- Lua

Editor-oriented formats include:
- HTML
- CSS
- JSON
- Markdown
- YAML
- SQL
- XML

> Runtime execution support depends on the external compiler provider and may vary by provider availability.

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

### Platform / Deployment
- Vercel for frontend hosting
- Render for backend hosting
- Piston API for code execution

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
|- package.json
|- package-lock.json
|- turbo.json
`- README.md
```

## Architecture

### Frontend
The frontend is responsible for:
- onboarding and user profile capture
- workspace rendering
- theme selection
- file management
- editor interactions
- terminal and output presentation
- API communication with the backend compiler service

### Backend
The backend is responsible for:
- exposing a clean execution endpoint
- forwarding code execution requests to the runtime provider
- returning compiler and runtime output to the frontend
- applying basic rate limiting and request control

### Execution Flow
1. User opens VoidLAB
2. User enters profile details
3. User enters the editor workspace
4. Code is written or updated in the Monaco editor
5. Frontend sends execution request to backend
6. Backend forwards request to the runtime provider
7. Output is returned and shown in the terminal panel

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- npm 10+

### Installation

```bash
npm install
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

## Environment Variables

### Frontend
Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend
Create `apps/api/.env`:

```env
PORT=5000
PISTON_API_URL=https://emkc.org/api/v2/piston
```

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
- Hosted on **Vercel**
- Root directory: `apps/web`

### Backend Deployment
- Hosted on **Render**
- Uses the Express API from `apps/api`

### Required Frontend Production Variable
```env
NEXT_PUBLIC_API_URL=https://voidlab.onrender.com
```

---

## Key Product Capabilities

- polished onboarding and workspace personalization
- shareable public product URL
- cloud editor workflow
- execution pipeline through backend API
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
- live deployment links

Possible next upgrades:
- authentication with database-backed sessions
- GitHub OAuth and one-click publish
- collaborative editing
- saved projects in database
- team workspaces
- project templates
- AI code assistance
- terminal emulation
- deployment from inside the editor

---

## Author

**Rudranarayan Jena**  
GitHub: [@liambrooks-lab](https://github.com/liambrooks-lab)

---

## Repository Info

- **Project Name**: VoidLAB
- **Maintainer**: Rudranarayan Jena
- **GitHub Username**: `liambrooks-lab`
- **Repository URL**: [https://github.com/liambrooks-lab/VoidLAB](https://github.com/liambrooks-lab/VoidLAB)

---

## Notes

- The public product URL is the main link intended for demos and sharing.
- The backend URL is infrastructure-facing and supports execution requests.
- Runtime language support depends on the external execution provider.
- Local development and cloud deployment are both supported.

---

## Contact

For project updates, collaboration, or product discussion:

- GitHub: [https://github.com/liambrooks-lab](https://github.com/liambrooks-lab)

---

<p align="center">
  Built by Rudranarayan Jena
</p>

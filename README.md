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

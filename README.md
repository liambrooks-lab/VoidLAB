# VoidLAB

VoidLAB is a monorepo for a premium cloud code editor and compiler experience. It includes a polished onboarding flow, responsive editor workspace, keyboard shortcuts, personalized profile greeting, and multi-language execution through Piston.

## Folder Structure

```text
VoidLAB/
├─ apps/
│  ├─ api/
│  │  └─ src/
│  │     ├─ controllers/
│  │     ├─ middleware/
│  │     ├─ models/
│  │     ├─ routes/
│  │     └─ index.ts
│  └─ web/
│     ├─ public/
│     └─ src/
│        ├─ app/
│        ├─ components/
│        ├─ context/
│        ├─ hooks/
│        └─ lib/
├─ packages/
│  ├─ config/
│  └─ tsconfig/
├─ .github/
├─ turbo.json
└─ package.json
```

## Features

- Premium login screen with name, phone, region, email, and display picture.
- Personalized workspace header showing `Hi <first-name>`.
- Monaco-based editor with responsive layout.
- Keyboard shortcuts for run, save, and panel control.
- Broad language support for editing plus execution for Piston-supported runtimes.
- GitHub-friendly monorepo layout.

## Run Locally

```bash
npm install
npm run dev -w api
npm run dev -w web
```

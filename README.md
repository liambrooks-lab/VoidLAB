# VoidLAB

VoidLAB is a premium cloud code editor and compiler built as a monorepo. It includes a polished onboarding flow, responsive editor workspace, project tabs, file explorer, theme switching, keyboard shortcuts, and multi-language execution through Piston.

## Live Links

- Live product: https://void-lab-web.vercel.app/
- Backend API: https://voidlab.onrender.com
- GitHub repository: https://github.com/liambrooks-lab/VoidLAB.git

If you want to show the product to someone, share the Vercel link. That is the main user-facing URL.

## Folder Structure

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
|  `- web/
|     |- public/
|     `- src/
|        |- app/
|        |- components/
|        |- context/
|        |- hooks/
|        `- lib/
|- packages/
|  |- config/
|  `- tsconfig/
|- .github/
|- turbo.json
`- package.json
```

## Features

- Premium login screen with name, phone, region, email, and display picture
- Personalized workspace header showing `Hi <first-name>`
- Monaco-based editor with tabs and file explorer
- Theme switching for the workspace UI
- Keyboard shortcuts for run, save, and file creation
- Broad language support for editing plus execution for many Piston-supported runtimes
- GitHub-friendly monorepo layout

## Run Locally

```bash
npm install
npm run build -w api
npm run start -w api
npm run dev -w web
```

## Deployment

- Frontend is deployed on Vercel
- Backend is deployed on Render
- Set `NEXT_PUBLIC_API_URL` on Vercel to the Render backend URL

## Purpose

The Vercel link is the fixed product URL you can:

- share with users
- send to friends or clients
- place in your README
- use for demos and portfolio presentations

# <img src="apps/web/public/assets/logo-icon.svg" alt="VoidLAB prism logo" width="30" valign="middle" /> VoidLAB

<p align="center">
  <strong>Modern online multi-language code editor, compiler, OAuth app, and GitHub publishing workspace.</strong>
</p>

<p align="center">
  <a href="#english">
    <img alt="Read in English" src="https://img.shields.io/badge/Read-English-0f172a?style=for-the-badge" />
  </a>
  <a href="#hindi">
    <img alt="Read in Hindi" src="https://img.shields.io/badge/Read-Hindi-1d4ed8?style=for-the-badge" />
  </a>
</p>

<p align="center">
  <a href="https://void-lab-web.vercel.app/">Live App</a>
  •
  <a href="https://voidlab.onrender.com">API</a>
  •
  <a href="https://github.com/liambrooks-lab/VoidLAB">Repository</a>
</p>

---

<a id="english"></a>
## English

### What VoidLAB Is
VoidLAB is a polished full-stack online IDE built for writing, running, testing, and publishing code from the browser. It combines a Monaco-based editor, multi-file workspace, real OAuth sign-in, Judge0-powered code execution, stdin support for interactive programs, and direct GitHub publishing.

### Major Features
- Real OAuth login with Google, GitHub, and X
- Secure app session handling with JWT cookies
- Provider token storage encrypted at rest
- PostgreSQL-backed auth and OAuth account persistence
- Multi-language online editor and compiler
- Proper `stdin` support for interactive programs
- C++ execution with `-std=c++26`
- Active-file GitHub push with repository creation and branch targeting
- Multi-file workspace, explorer, tabs, preview, and terminal output
- Collaboration, AI guide, manual, and profile pages
- Responsive UI with multiple themes, including Porcelain

### Runnable Languages
- C
- C++
- Java
- Python
- JavaScript
- TypeScript
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- Bash
- Lua
- C#

### Editor / Preview Support
- HTML
- CSS
- JSON
- Markdown
- YAML
- SQL
- XML
- PowerShell

### Authentication and Security
- OAuth starts from `/api/auth/google`, `/api/auth/github`, and `/api/auth/x`
- Callback handlers exchange auth codes for provider access tokens
- User info is fetched from the provider and linked to a local app user
- GitHub tokens are stored encrypted for repository push support
- App sessions are stored in secure `httpOnly` cookies
- OAuth state is validated and X uses PKCE

### GitHub Publishing
VoidLAB can push the active file directly to GitHub.

Flow:
1. Sign in and connect GitHub
2. Open the GitHub page
3. Click `Push to GitHub`
4. Enter repository name, description, visibility, and branch
5. VoidLAB creates the repo if needed and commits the active file
6. The app returns the repository URL on success

### Tech Stack
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Monaco Editor
- Express
- PostgreSQL
- Judge0 CE
- JWT + cookie-based auth

### Monorepo Structure
```text
VoidLAB/
|- apps/
|  |- api/
|  `- web/
|- packages/
|- docker-compose.yml
|- package.json
`- README.md
```

### Local Setup
#### Prerequisites
- Node.js 18+
- npm 10+
- PostgreSQL 15+ or Docker

#### Install
```bash
npm install
```

#### Start local PostgreSQL with Docker
```bash
docker-compose up -d postgres
```

#### Backend env (`apps/api/.env`)
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

#### Frontend env (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Run the apps
```bash
npm run build -w api
npm run start -w api
```

In another terminal:
```bash
npm run dev -w web
```

### Production Deployment Checklist
#### Render API
Set:
- `PORT`
- `NODE_ENV=production`
- `API_BASE_URL`
- `WEB_APP_URL`
- `DATABASE_URL`
- `DATABASE_SSL=true` or `require`
- `DATABASE_SSL_REJECT_UNAUTHORIZED=false` if your provider needs it
- `JUDGE0_API_URL`
- `JWT_SECRET`
- `APP_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- Optional mail vars: `RESEND_API_KEY`, `VOIDLAB_FROM_EMAIL`

#### Vercel Web
Set:
- `NEXT_PUBLIC_API_URL=https://your-render-api-domain`

### OAuth Callback URLs
Register these in each provider dashboard:

#### Local
- `http://localhost:5000/api/auth/google/callback`
- `http://localhost:5000/api/auth/github/callback`
- `http://localhost:5000/api/auth/x/callback`

#### Production
- `https://your-render-api-domain/api/auth/google/callback`
- `https://your-render-api-domain/api/auth/github/callback`
- `https://your-render-api-domain/api/auth/x/callback`

### Build Commands
```bash
npm run build -w api
npm run build -w web
```

### Current Product Status
VoidLAB is now ready for real public usage with:
- real OAuth login
- production-safe Postgres auth storage
- secure provider-token handling
- real GitHub repository push
- working stdin-based execution for runnable languages

---

<a id="hindi"></a>
## हिन्दी

### VoidLAB क्या है
VoidLAB एक modern full-stack online IDE है जिसमें browser के अंदर code लिखना, run करना, test करना, और GitHub पर publish करना possible है। इसमें Monaco editor, multi-file workspace, real OAuth login, Judge0 execution, interactive stdin support, और direct GitHub push मौजूद है।

### मुख्य फीचर्स
- Google, GitHub, और X के साथ real OAuth login
- Secure JWT cookie-based app session
- Provider access token encrypted storage
- PostgreSQL-based auth और user persistence
- Multi-language online editor और compiler
- Interactive programs के लिए proper `stdin` support
- C++ के लिए `-std=c++26`
- Active file को GitHub repo में direct push
- Multi-file explorer, tabs, preview, और output terminal
- Collaboration, AI guide, manual, और profile pages
- Responsive UI और multiple themes

### Run होने वाली भाषाएँ
- C
- C++
- Java
- Python
- JavaScript
- TypeScript
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- Bash
- Lua
- C#

### Editor / Preview वाली भाषाएँ
- HTML
- CSS
- JSON
- Markdown
- YAML
- SQL
- XML
- PowerShell

### Auth और Security
- Login `/api/auth/google`, `/api/auth/github`, और `/api/auth/x` से शुरू होता है
- Callback पर auth code exchange होकर provider token मिलता है
- User info provider से fetch होकर local app user से link होती है
- GitHub token encrypted form में store होता है
- App session secure `httpOnly` cookie में रखा जाता है
- OAuth state validation और X के लिए PKCE enabled है

### GitHub Push कैसे काम करता है
1. Sign in करें और GitHub connect करें
2. GitHub page खोलें
3. `Push to GitHub` दबाएँ
4. Repository name, description, visibility, branch भरें
5. VoidLAB ज़रूरत हो तो repo create करेगा
6. Active file commit होकर selected branch पर push हो जाएगी
7. Success पर repo URL दिखेगा

### Local Setup
#### ज़रूरी चीज़ें
- Node.js 18+
- npm 10+
- PostgreSQL 15+ या Docker

#### Install
```bash
npm install
```

#### Docker से local Postgres चालू करें
```bash
docker-compose up -d postgres
```

#### Backend env
`apps/api/.env` में:
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

#### Frontend env
`apps/web/.env.local` में:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Run करें
```bash
npm run build -w api
npm run start -w api
```

दूसरे terminal में:
```bash
npm run dev -w web
```

### Production Deployment
#### Render API पर
इन env vars को सेट करें:
- `API_BASE_URL`
- `WEB_APP_URL`
- `DATABASE_URL`
- `DATABASE_SSL`
- `DATABASE_SSL_REJECT_UNAUTHORIZED`
- `JUDGE0_API_URL`
- `JWT_SECRET`
- `APP_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`

#### Vercel Web पर
- `NEXT_PUBLIC_API_URL=https://your-render-api-domain`

### OAuth Callback URLs
#### Local
- `http://localhost:5000/api/auth/google/callback`
- `http://localhost:5000/api/auth/github/callback`
- `http://localhost:5000/api/auth/x/callback`

#### Production
- `https://your-render-api-domain/api/auth/google/callback`
- `https://your-render-api-domain/api/auth/github/callback`
- `https://your-render-api-domain/api/auth/x/callback`

### अभी Product किस हालत में है
VoidLAB अब public use के लिए ready है क्योंकि इसमें:
- real OAuth login
- Postgres-backed auth storage
- secure token handling
- real GitHub push
- interactive stdin execution support


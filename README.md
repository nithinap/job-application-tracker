# Job Search Workspace

Private, single-user job application tracker built for Netlify Free.

## Local development

Requires Node.js 22.12+ and npm. If you use nvm, the project selects Node 22 from `.nvmrc`:

```sh
nvm install
nvm use
npm install
npm run dev
```

`npm run dev` starts Vite through Netlify Dev, which serves the app and functions and provides a local Netlify Database. In a second terminal, with the dev server still running, apply the local schema:

```sh
npx netlify database migrations apply
```

The local API allows requests without a Netlify login only when `CONTEXT=dev`.

## Netlify setup

1. Create a separate private GitHub repository under your personal account and connect it to a new Netlify project.
2. Keep the Netlify project private for production and deploy previews. On Free, only the team owner can access it.
3. Add Netlify Database to the project. The migration in `netlify/database/migrations` creates the tracker tables.
4. Push code to GitHub to deploy. Keep resume files and application data in Netlify storage, never in this repository.

The Free plan's 300 monthly credits are shared by all projects in the same Netlify team. Production deploys use 15 credits each; all projects pause if the team's hard limit is reached. Use Deploy Previews while iterating and monitor the team's credit balance.

## Current scope

The interface uses React with Vite and keeps the existing Netlify Functions and database backend. The app tracks opportunities, status changes, job URLs/descriptions, and follow-ups. It does not yet fetch job pages, import a LaTeX resume, generate tailored resumes, or export PDFs.

# Job Search Workspace

A personal job application tracker built for private Netlify hosting.

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

1. Connect this GitHub repository to a new Netlify project.
2. Keep the Netlify project private for production and deploy previews. On Free, only the team owner can access it.
3. Add Netlify Database to the project. The migration in `netlify/database/migrations` creates the tracker tables.
4. Push code to GitHub to deploy. Keep resume files and application data in Netlify storage, never in this repository.

The Free plan's 300 monthly credits are shared by all projects in the same Netlify team. Production deploys use 15 credits each; all projects pause if the team's hard limit is reached. Use Deploy Previews while iterating and monitor the team's credit balance.

The GitHub repository is currently public, so its source and planning files are visible. Netlify site privacy is a separate setting; change repository visibility too if you want the source private.

## Current scope

The interface uses React with Vite, Netlify Functions, and Netlify Database. It tracks opportunities, status changes, job URLs and descriptions, and follow-ups. **Quick capture** opens a review form from a desktop browser bookmarklet; it does not create a role until you choose **Save role**. On mobile, use **Add role** and paste the posting URL. Page title and URL are captured; company and location are best-effort. On LinkedIn, review all three fields because the title may include site/company text and company or location may be blank. The app does not yet import a LaTeX resume, generate tailored resumes, or export PDFs.

### Install the bookmarklet in Chrome

Open **Quick capture** in the app and drag **Track this job** to the bookmarks bar. If Chrome does not accept the drag:

1. Right-click **Track this job** and select **Copy Link Address**.
2. Open **Bookmarks → Bookmark Manager**, then select **Organize → Add new bookmark**.
3. Name it **Track this job**, paste the copied address, choose **Bookmarks Bar**, and save.

If the bookmarks bar is crowded, the bookmark may be under the **»** overflow menu. Click it while a job posting is open to review the captured details in the tracker.

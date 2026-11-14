# Job Search Workspace — Product Plan

## Goal

Build a private personal workspace that carries a job search from saving a role through applying, follow-up, and outcome. It should also keep a reliable source of truth for career experience and help produce a role-specific resume without inventing qualifications.

## Recommended product boundary

Build a privately hosted, single-user web app for one job seeker. Use the same GitHub-push-to-Netlify deployment workflow as the personal website, but put the app in its own private GitHub repository and its own Netlify project. This keeps the job app's access controls and deployment settings independent from the personal website and reduces the chance of career data entering a website repo. Keep job records, the resume source, and generated files in private runtime storage; the Git repo should contain application code only.

The current Netlify Free plan supports this single-owner setup: private project visibility, personal-account private GitHub repositories, Functions, Netlify Database (Basic), and Blobs are included. Keep the Netlify project private for production and previews. A private GitHub repo does not, by itself, make the deployed app private. On Free, private projects are owner-only, which matches the one-user scope; every data-reading/writing function should still verify the authenticated Netlify user. Store service credentials in Netlify environment variables, never in the repo.

Design to the Free plan's 300-credit monthly hard limit. Credits are shared across all projects in the same Netlify team; a production deploy costs 15 credits, while compute, bandwidth, requests, database usage, and any Netlify AI inference also consume credits. If the shared limit is reached, all projects in that team pause until the next billing cycle. Use free Deploy Previews for iteration, keep production deploys deliberate, monitor team usage, and check the existing personal site's usage before adding the app. If protecting the personal site's remaining credit budget becomes important, consider a separate Free Netlify team for the job app. Netlify Database storage is currently listed as free, but its compute and bandwidth count toward credits; retain user-triggered exports and independent backups rather than relying only on the Free plan's short backup retention.

The first release should do three connected things well:

1. Keep job opportunities and application progress in one searchable pipeline.
2. Turn an existing resume into an editable, evidence-backed career profile.
3. Generate and save a tailored resume version for a selected opportunity, with the user reviewing every substantive change.

Job discovery from LinkedIn is a later integration question, not a dependency for the core product.

## First implementation slice

The current build starts with role entry and editing, a minimalist table, searchable/status-filtered tracking, follow-up indicators, and creation/status history. Users can save a posting URL and paste a job description. This slice does not fetch the URL or generate a resume yet; those depend on the source-specific access rules and the supplied LaTeX resume.

## Product decisions and critical constraints

### 1. Application tracking

The tracker is the durable center of the product. The user should be able to create an opportunity quickly by filling a form or pasting job details, then enrich it later. A record should include:

- Company, title, location, work arrangement, employment type, compensation when known, and source.
- Original posting URL and a saved copy of the job description, with a date last checked.
- Pipeline state: Saved, Interested, Preparing, Applied, Recruiter Screen, Interview, Offer, Rejected, Withdrawn, or Closed.
- Dates for discovery and application; contacts; notes; next action and due date.
- A fit summary and the resume version used, when applicable.

Keep the main screen minimalist and table-first: one-line pipeline counts, search, a status filter, quick status changes, and the next action. Skip a separate dashboard, card/board view, sorting controls, and advanced filter UI until the list size makes them useful. Every status change and important interaction should be recorded in a simple activity history.

**Design judgment:** start with one opportunity record that moves from saved to applied. Separate “job posting” and “application attempt” entities only if repeated applications to the same posting or multiple people using the workspace become real needs. This keeps early data entry fast.

### 2. Career profile and resume tailoring

The supplied LaTeX resume is the starting layout and styling source, not the only source of truth. Keep the original `.tex` file and any referenced assets as private source artifacts. During profile setup, map its sections and bullets into verified career facts, then adapt the LaTeX template once so tailored content can be inserted without brittle edits to arbitrary TeX text. Keep structured experience facts such as:

- Organization, role, dates, location, and scope.
- Accomplishment statements and supporting details (metrics, scale, tools, methods, and context).
- Skills, education, certifications, and preferred wording.
- A link from each fact to its source resume section or user confirmation.

For each selected opportunity, the resume workflow should:

1. Extract job requirements from the saved description and let the user correct them.
2. Show an evidence map: requirement → matching experience facts → gaps or unknowns.
3. Propose a tailored summary, skill ordering, and reordered or rewritten bullets using only verified facts.
4. Show a clear before/after diff and let the user accept, edit, or reject each proposal.
5. Save an immutable, dated resume version linked to that opportunity and export tailored `.tex` and PDF files while retaining the user's original visual style.

**Critical guardrail:** generation must not turn a missing qualification into a claim, inflate metrics, alter dates, or silently merge distinct experience. Keep source facts and generated wording separate; make the evidence supporting each proposed bullet inspectable. A match score should explain its components and never imply a hiring prediction.

### 3. Relevant job discovery

“Highly relevant” needs explicit preferences, not only title similarity. The profile should let the user set role families and keywords, seniority, location/remote preferences, compensation floor, industries, company preferences, and hard constraints. Recommendations should show why a role matches and what is unknown. Start with transparent rules and allow the user to tune preferences; do not hide the reasoning in a single opaque score.

For a user-provided job URL, try to retrieve and extract a public listing only when the source permits automated access and the page is reachable without signing in. Show extracted company/title/location/description for confirmation before tailoring. Pages that block retrieval, require authentication, or prohibit automated copying should fall back to a paste-description field. Apply URL validation, redirect checks, private-network blocking, response-size limits, and a short timeout to the fetch endpoint.

For LinkedIn specifically, current official developer documentation describes limited open consumer permissions (basic sign-in/profile and sharing) and talent/job-posting integrations that require approval and are aimed at partner/ATS workflows. It does not present a generally available job-seeker search API. LinkedIn’s User Agreement also prohibits scraping/copying the service. Therefore:

- Do not make scraping, a browser extension that reads pages, or automated account access part of this plan.
- For the initial product, let the user save a LinkedIn posting URL, but require them to paste the job description/details if the page cannot be lawfully and reliably retrieved. The product can retain the user-provided record and link back out.
- If discovery becomes valuable, evaluate permitted feeds/APIs from other job sources and use a provider adapter so sources can be added independently.
- Revisit a LinkedIn integration only if LinkedIn provides an approved, applicable job-seeker search capability for this use case.

This keeps LinkedIn as an optional source while preserving the value of tracking and tailoring.

## Primary user flow

1. Import a resume and review the parsed career profile.
2. Save an interesting role by providing its URL; when the source can be fetched, confirm the extracted details, and otherwise paste the job description or fill the short form.
3. Review extracted company/title/location/requirements and correct anything uncertain.
4. Compare the role against career facts and decide whether to pursue it.
5. Create a tailored resume, review changes, and export the approved version.
6. Move the role to Applied, attach the exact resume version, and set the next follow-up.
7. Log recruiter conversations/interviews and track the final outcome.

The workflow should still be useful without AI: manual entry, filtering, activity history, and attaching an existing resume version remain available.

## Proposed data model

- **Opportunity:** company, role, location, work arrangement, source, URL, full description, status, dates, compensation, notes, next action, and user-edited preference/fit signals.
- **Activity:** timestamped status changes, notes, contacts, follow-ups, and interview events tied to an opportunity.
- **Career fact:** organization, role, dates, accomplishment/skill/education details, evidence/source, and verification state.
- **Resume version:** full exported content, source facts used, opportunity link, revision date, approval state, and file reference.
- **Search preferences:** role families, locations, work modes, seniority, compensation, company/industry preferences, hard constraints, and weights.

Avoid storing only the final PDF: keep the structured content and tailored LaTeX source as well, so versions can be compared and regenerated without losing edits.

## Suggested technical shape

Use a separate private GitHub repo connected to a separate private Netlify project. Pushes to the main branch deploy the application; pull request previews should also stay private and must not be pointed at production data. A small React UI built with Vite and Netlify Functions for server-side actions fits the GitHub-to-Netlify workflow.

Use the Free plan's Netlify Database (Basic) for opportunities, activities, profile facts, preferences, and resume-version metadata. Use Netlify Blobs for the original `.tex`, any required resume assets, and generated artifacts. Access blobs only through authenticated server-side functions with opaque identifiers, never public file URLs. Netlify documents Blobs encryption at rest and in transit, while also placing responsibility on the app to prevent its own code from leaking stored data. Keep user-triggered exports and independent backups in scope. Keep PDF compilation and AI calls efficient: Netlify runtime/database usage counts toward the shared credit limit, and model-provider charges may be separate. If usage grows beyond the Free plan, revisit the database and hosting budget before upgrading.

LaTeX compilation is a small technical spike before committing to PDF export: confirm a secure, reliable PDF renderer can run within Netlify's function/runtime constraints without exposing resume content to an unrelated third party. If that is not viable, the first resume milestone should still export the tailored `.tex` and include a clearly scoped private rendering path before calling PDF export complete.

For AI-assisted extraction and writing, use a server-side provider interface, strict structured outputs, and human review. Send only the selected resume facts and job description needed for a task. Make model use visible; do not put provider secrets in the browser. Provide deletion/export controls and test authorization on every endpoint before storing real resume data.

## Delivery sequence

### Phase 0 — Confirm product assumptions

The hosting direction is a private Netlify project on the Free plan, connected to a private personal-account GitHub repo. Inspect the supplied LaTeX file and any referenced assets; review the Netlify team's current credit usage; collect the job-search preferences that affect matching. Probe PDF compilation in a Netlify-compatible runtime before locking export implementation.

### Phase 1 — Tracker foundation

Build opportunity capture/editing, status pipeline, a compact table, basic search/status filtering, activity history, and follow-up dates. Add export and richer views only when real usage shows they are needed.

### Phase 2 — Career profile

Add LaTeX source import, structured career facts, verification/editing, and a clean master resume view. Preserve the source template and referenced assets. Keep this useful without a language model.

### Phase 3 — Tailoring and exports

Add URL-or-description capture, job-description extraction, the evidence map, tailored content proposals, review/diff, version history, tailored `.tex` output, and PDF rendering. Evaluate quality against several real postings and verify that no unsupported facts appear.

### Phase 4 — Discovery integrations

Add transparent matching against permitted job sources, then decide whether any approved LinkedIn integration is available. Keep source-specific ingestion separate from the tracker and resume workflow.

## MVP acceptance criteria

- A user can add, edit, search, filter, and categorize opportunities, then move them through the pipeline.
- Each opportunity shows its description, source link, status history, contacts/notes, and next action.
- A LaTeX resume can be imported into editable career facts and corrected by the user while its visual style is retained in tailored output.
- A permitted public job URL can be captured automatically; if it cannot be safely fetched, the user can paste the description and continue.
- For a saved role, the app can show matching evidence and propose a resume variant without adding unverified claims.
- The user can review and edit the variant, export it, and find the exact version later from the opportunity.
- The user can export their tracker/profile data and delete stored source files and generated versions.

## Questions to settle before implementation

1. Please provide the `.tex` resume and any assets it depends on (for example, custom `.sty` files, fonts, or images) so we can map its structure and assess PDF rendering.
2. Confirm that a separate private GitHub repo and Netlify project are acceptable; the plan is to leave the personal website project untouched.
3. Job discovery is intentionally deprioritized. URL capture plus pasted-description fallback is the initial path; source-specific integrations can wait.

## Sources checked for LinkedIn feasibility

- [LinkedIn API access overview](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access)
- [LinkedIn Job Posting API overview](https://learn.microsoft.com/en-us/linkedin/talent/job-postings/api/overview)
- [LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement)
- [Netlify project visibility](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/)
- [Netlify pricing and plans](https://www.netlify.com/pricing/#teams)
- [Netlify credit usage and limits](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/)
- [Netlify Git repository support](https://docs.netlify.com/build/git-workflows/overview/)
- [Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/)
- [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Netlify Git-based deployments](https://docs.netlify.com/deploy/create-deploys/)

# Project Progress

_Last updated at packaging time._

## Current status: **feature-complete and locally verified; awaiting your accounts for deployment**

| Category | Status |
|---|---|
| ✅ Implemented and tested | Auth (register/login/logout/me), bcrypt hashing, JWT HTTP-only cookies, validation, centralized errors, projects CRUD (+cascade), tasks CRUD (+search/filter/sort/pagination), dashboard, profile/password, activity log, admin role routes, ownership enforcement, React UI (all pages), route guards, toasts, responsive layout |
| ✅ Tests executed & passing | 101 backend (34 unit + 67 integration, MongoDB 8.0), 41 frontend, 22-check end-to-end smoke ×3 modes, production build |
| ✅ Verified locally | `api/index.js` handler in production mode: Secure/HttpOnly cookie, security headers, full flow |
| ⏳ Implemented, awaiting credentials | MongoDB Atlas connection, GitHub push, Vercel deployment (steps in DEPLOYMENT.md) |
| ⏳ Configured, not executable here | `vercel.json` rewrites (verify after first deploy) |
| ❌ Not done | Live deployment; verification on real HTTPS; real-browser visual QA; admin UI page; email-based password reset; refresh tokens; shared-store rate limiting |

## Completed work (build order)
1. Architecture + project setup (repo, `.gitignore`, `.env.example`, `vercel.json`)
2. Backend: models, validators, middleware, controllers, routes, error handling
3. MongoDB integration (cached connection, health endpoints, seed script)
4. Authentication & authorization
5. Backend tests (unit + integration) → fixed a test-counting mistake
6. Frontend: services, context, components, pages, layouts
7. Frontend tests → found and fixed a logout bug
8. Integration: Vite proxy, smoke script, production-mode handler check
9. Documentation set, Postman collection, VS Code debug config
10. ZIP packaging and verification

## Local git history (sandbox)
See `docs/GIT_LOG.txt`. The `.git` folder is **not** in the ZIP – run the `git init` sequence in DEPLOYMENT.md to start your own history.

## Known issues / limitations
1. **bcryptjs instead of native bcrypt** (same algorithm; chosen for serverless reliability).
2. Rate limiter is per serverless instance (best-effort).
3. `sort=due` places tasks **without** due dates first (MongoDB ascending-null behaviour); the UI shows "No due date". Easy improvement: aggregate with a null-last weight like the priority sort.
4. No password reset / email verification; JWT is not revocable before expiry (logout only clears the browser cookie).
5. No CSRF token; relies on `SameSite=Lax` + JSON content type. Fine for same-origin; add a CSRF token if you ever go cross-site.
6. Task titles/descriptions are rendered as text by React (XSS-safe by default); no rich text.
7. Activity entries disappear after 90 days (TTL index) by design.
8. Atlas `0.0.0.0/0` required for Vercel unless using static IPs (security trade-off documented).
9. UI not visually inspected in a real browser during the build.

## Next steps for you
1. `npm run install:all`, create `.env`, run `npm run dev`, click through the manual checklist in TESTING.md.
2. Create Atlas cluster → set `MONGODB_URI` → `npm run seed`.
3. Git init + push to GitHub (Part D).
4. Import into Vercel, add env vars, deploy (Part F).
5. Run `BASE_URL=https://… node scripts/smoke-test.mjs`; update this file with the results.
6. Stretch goals: admin page, pagination UI for projects, drag-and-drop board, file attachments, password reset, E2E tests with Playwright.

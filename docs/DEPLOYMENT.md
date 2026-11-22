# Deployment Guide (GitHub → MongoDB Atlas → Vercel)

> **Status:** configuration is ready and the serverless entry point was tested locally in production mode. A *live* deployment has **not** been performed – it requires your GitHub, Atlas and Vercel accounts. Follow the steps below; each has a verification.

## Overview
```
your computer ──git push──▶ GitHub ──webhook──▶ Vercel build ──▶ live site
                                                   │  static: client/dist (CDN)
                                                   └─ function: api/index.js ──▶ MongoDB Atlas
```

## 0. Pre-flight (local)
```bash
npm run install:all
npm run test:unit && npm run test:client && npm run build      # all should pass
git status                                                       # .env must not be listed
```

## 1. GitHub
Detailed commands with explanations: [MANUAL_CONNECTION_GUIDE.md → Part D](MANUAL_CONNECTION_GUIDE.md#part-d--git--github). Short form:
```bash
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```
Create the (empty) repository on github.com first. Verify: files visible on GitHub, **no `.env`, no `node_modules`**.
Recommended: protect `main` (Settings → Branches) and work via branches + pull requests.

## 2. MongoDB Atlas
Full steps: [MANUAL_CONNECTION_GUIDE.md → Part B](MANUAL_CONNECTION_GUIDE.md#part-b--express--mongodb-atlas). Checklist:
- [ ] M0 cluster created
- [ ] Database user (strong generated password saved in a password manager)
- [ ] Network Access: `0.0.0.0/0` for Vercel (functions have no fixed IP); your own IP for local work
- [ ] Connection string with database name `/taskflow`

> Security note on `0.0.0.0/0`: it removes the IP allow-list as a layer of defence, so the long random password (and never committing it) is what protects the database. Use a user restricted to the `taskflow` database, and rotate the password if exposed.

## 3. Vercel
1. Sign in at vercel.com with GitHub → **Add New → Project** → import the existing `taskflow` repository.
2. Framework Preset **Other**, Root Directory `./`. Leave build/output blank (taken from `vercel.json`).
3. Add environment variables (below) → **Deploy**.
4. Open the URL → verify (section 5).

### `vercel.json` explained
| Key | Purpose |
|---|---|
| `installCommand` | installs root (API) dependencies |
| `buildCommand` | installs client dependencies (including dev dependencies such as Vite) and runs `vite build` |
| `outputDirectory` | folder Vercel serves statically (`client/dist`) |
| `rewrites[0]` `/api/(.*)` → `/api` | every API URL runs `api/index.js` (Express) |
| `rewrites[1]` anything except `/api/…` → `/index.html` | lets React Router handle deep links/refresh. Real files (JS/CSS/images) are served before rewrites apply |
| `functions."api/index.js".maxDuration` | max seconds a request may run (15) |

## 4. Environment variables

| Variable | Where to enter | Value | Required |
|---|---|---|---|
| `MONGODB_URI` | Vercel → Project → Settings → Environment Variables (Production, and Preview if wanted) | Atlas URI incl. `/taskflow` | ✅ |
| `JWT_SECRET` | same | 48 random bytes hex: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` – **not** the same as local | ✅ |
| `NODE_ENV` | same | `production` | ✅ (cookies `Secure`) |
| `JWT_EXPIRES_IN` | same | `7d` | optional |
| `BCRYPT_ROUNDS` | same | `10` | optional |
| `CLIENT_URL` | same | only for a separate frontend origin | leave unset |
| `VITE_API_URL` | same | only for a separate API origin (build-time variable) | leave unset |
| `PORT`, `MONGODB_URI_TEST` | – | local only; not needed on Vercel | – |

Variables are read when a function starts; after adding/changing one, click **Redeploy**. Never prefix secrets with `VITE_` – those are embedded in the public JavaScript bundle.

## 5. Verify the live site
```bash
curl https://YOUR-APP.vercel.app/api/health          # {"success":true,…}
curl https://YOUR-APP.vercel.app/api/health/db       # "database":"connected"
BASE_URL=https://YOUR-APP.vercel.app node scripts/smoke-test.mjs   # expect ALL CHECKS PASSED
```
Then in the browser: register → create project/task → refresh on `/tasks` (no 404) → log out/in → check Atlas for the documents.
The smoke test creates two throw-away users (`smoke_…@example.com`); delete them in Atlas afterwards if you like.

## 6. Production configuration choices
* **Same-origin routing** (frontend + API on one domain): no CORS, first-party cookies, simplest security.
* **Cookie:** `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=7d`. HTTPS is automatic on Vercel; HSTS sent by helmet.
* **Connection caching** in `server/config/db.js` for serverless.
* **Rate limiting** is in-memory per function instance → best-effort only. For strict limits use a shared store (e.g., Upstash Redis) or Vercel Firewall rules.
* **Ephemeral filesystem:** nothing is written to disk.
* **Region:** place the Vercel function region near your Atlas region (Project Settings → Functions) to reduce latency.

## 7. Updating and rolling back
`git push` to `main` → automatic production deploy. Branches/PRs → preview URLs (add env vars to Preview if you want them to work with the DB). Roll back: Vercel → Deployments → previous deployment → **Instant Rollback / Promote**.

## 8. Troubleshooting
See [DEBUGGING.md §6](DEBUGGING.md) and the error table in [MANUAL_CONNECTION_GUIDE.md → Part F](MANUAL_CONNECTION_GUIDE.md#part-f--github--vercel).

## 9. What I could not do for you
| Step | Reason | Your action |
|---|---|---|
| Push to GitHub | no access to your account | commands in section 1 |
| Create Atlas cluster | no access to your account | Part B |
| Deploy to Vercel | no access to your account | section 3 |

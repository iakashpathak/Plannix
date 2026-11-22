# Debugging Guide

**Method (works for any bug):** 1) reproduce it · 2) find which layer fails (browser → network → API → database) · 3) read the *exact* error text · 4) change one thing · 5) re-test · 6) add a test so it can't return.

**Which layer?** Open DevTools → **Network**, repeat the action, click the request:
* No request appears → frontend bug (handler/validation).
* Red / `(failed)` / status `0` → network, proxy, CORS or server down.
* `4xx` → the server rejected it; read the `message`/`errors` in **Response**.
* `5xx` → server crash; read the server terminal / Vercel function log.
* `200` but UI wrong → frontend state/render bug.

---
## 1. Error message catalogue

| Message / symptom | Root cause | Solution |
|---|---|---|
| `Cannot reach the server. Check your connection…` (UI) | API not running, proxy target wrong, offline | `npm run dev:server`; match `PORT` and the proxy `target`; check `/api/health` |
| `Not authenticated. Please log in.` (401) | No cookie sent | Log in; Axios `withCredentials: true`; same origin |
| `Invalid session. Please log in again.` (401) | Tampered/garbage token, or `JWT_SECRET` changed | Log out, clear cookies, log in |
| `Session expired. Please log in again.` | Token older than `JWT_EXPIRES_IN` | Log in again |
| `Validation failed` (400) + `errors[]` | Request broke a Zod rule | Read `errors[].field/message` |
| `Invalid id` / `Invalid _id` (400) | Malformed ObjectId in URL | Use the 24-hex `_id` from API |
| `Route not found: GET /api/x` (404) | Typo or wrong method | Check [API_DOCUMENTATION.md](API_DOCUMENTATION.md) |
| `Project not found` (400 on task create/update) | Project id wrong **or belongs to another user** | Pick one of your own projects |
| `Task not found` / `Project not found` (404) | Wrong id, or not yours (intentional) | Re-list and use correct id |
| `An account with this email already exists` (409) | Duplicate email | Log in instead |
| `Too many attempts…` (429) | Rate limiter (30 auth requests/15 min/IP) | Wait; relax limit in `authRoutes.js` while developing |
| `Database is unavailable…` (503) | Cannot reach MongoDB | See §4 |
| `MONGODB_URI is not set…` (503) | Env var missing | `.env` (local) / Vercel env vars + redeploy |
| `JWT_SECRET is not set` (500) | Env var missing | Same |
| `Malformed JSON in request body` (400) | Bad JSON from client/Postman | Fix body; header `Content-Type: application/json` |
| `request entity too large` (413/500) | Body > 10 kB | Raise `express.json({limit})` |
| `Cannot use import statement outside a module` | Missing `"type":"module"` | In root `package.json` |
| `ERR_MODULE_NOT_FOUND … imported from …` | ESM import missing `.js` extension or typo | `import x from "./x.js"` |
| `OverwriteModelError` | Model compiled twice (hot reload) | `mongoose.models.X \|\| mongoose.model()` (already done) |
| `E11000 duplicate key` | Unique index violated | Handled as 409; for tests, clear collections |
| `Cast to ObjectId failed` | Passing a non-id to a query | Validate with `objectId` schema |
| `Port 5000 is already in use` (`EADDRINUSE`) | Another process (on macOS, AirPlay uses 5000) | Change `PORT` in `.env` **and** the proxy target |
| React: blank white page | JS error on load | Console tab; check `main.jsx` imports; on Vercel check rewrites |
| React: `Invalid hook call` | Two React copies or hook outside component | `npm ls react` in `client/`; call hooks at top level |
| React: `useAuth must be used inside <AuthProvider>` | Provider missing | Wrap in `main.jsx` (and in tests) |
| Infinite request loop in `useEffect` | Object/array in dependency list or state set unconditionally | Use primitives / `useCallback`; see `Tasks.jsx` |
| Tailwind classes have no effect | `content` globs don't match, or CSS not imported | `tailwind.config.js` → `./src/**/*.{js,jsx}`; `import "./index.css"` in `main.jsx` |

## 2. Frontend debugging
* **Console:** red errors show file:line. **Network:** payload, status, response, timing. **Application → Cookies:** is `token` there, HttpOnly, expiry?
* **React DevTools:** inspect `AuthProvider` value (`user`, `loading`) and component props/state.
* `console.log` the value *and its type*; remove logs afterwards.
* In tests: `screen.debug()` prints the DOM; use `findBy…` for async UI.
* Auth loops: check `loading` handling in `ProtectedRoute` and the `/auth/me` call.

## 3. Backend debugging
* Run **Debug API (Node)** in VS Code (F5) and set breakpoints in controllers/middleware; inspect `req.body`, `req.params`, `req.user`.
* `NODE_ENV=development` adds request logging (morgan) and stack traces in 5xx JSON responses.
* Print what Mongoose sends: `mongoose.set("debug", true)` in `server/config/db.js` (temporary).
* Reproduce with Postman/curl to separate backend from frontend problems.
* 401s: log `req.cookies` and `req.headers.authorization` in `protect`, confirm `cookieParser()` is registered first.
* Ownership bugs: verify every query contains `owner: req.user._id` (tests in `ownership.test.js` guard this).

## 4. Database connection debugging
1. `GET /api/health/db` – connected? What does the error say (server log shows the full error).
2. **Atlas → Network Access:** your current IP (or `0.0.0.0/0` for Vercel) must be listed and *Active*.
3. **Atlas → Database Access:** user exists, password correct, has read/write.
4. URI shape: `mongodb+srv://USER:PASS@HOST/taskflow?retryWrites=true&w=majority` – no `<` `>` left, special characters URL-encoded, database name present.
5. Test the URI outside the app: `mongosh "<uri>"`.
6. `querySrv ENOTFOUND`: DNS/VPN/firewall → try mobile hotspot or the non-SRV connection string.
7. Local MongoDB: is `mongod` running? Port 27017 free? Version ≥ 4.2 for Mongoose 8.
8. Inspect data: Atlas **Browse Collections** or `mongosh` → `db.users.find().limit(1)`.

## 5. API debugging
* Use the Postman collection (`docs/postman/…`). Order: Register → Login → others.
* Check: method, URL, `Content-Type: application/json`, body is valid JSON, cookie present.
* Compare status with the table in API_DOCUMENTATION.md; read `message` and `errors`.
* `curl -i -c jar.txt …` / `curl -i -b jar.txt …` shows headers and cookies.
* Run `node scripts/smoke-test.mjs` – a failing line pinpoints the broken capability.
* Run the single relevant test: `npx vitest tests/integration/tasks.test.js`.

## 6. Vercel deployment debugging
1. **Deployments → (deployment) → Build Logs** for build failures; **Logs** (or `vercel logs <url>`) for runtime errors.
2. Visit `/api/health` first (function alive?), then `/api/health/db` (DB reachable?).
3. Env vars: correct *environment* (Production vs Preview), spelled exactly, then **Redeploy**.
4. HTML returned for `/api/*` → rewrites wrong/missing; JSON 404 for page refresh → SPA rewrite missing. Compare with `vercel.json`.
5. Build can't find packages → root `installCommand` + client install in `buildCommand`.
6. `FUNCTION_INVOCATION_FAILED` → open the log, look for the first stack trace (usually missing env var or a wrong import path/case: Linux is case-sensitive, `Task.js` ≠ `task.js`).
7. Works locally but not deployed: diff env vars, Node version (`engines` is `>=18`), file name casing, hard-coded `localhost` URLs.
8. After fixing: `BASE_URL=https://… node scripts/smoke-test.mjs`.

## 7. Debugging tests
* `npx vitest tests/integration/auth.test.js -t "duplicate"` → one test.
* Read the **expected vs received** diff first. Decide: is the *test* wrong or the *code*? (In this project one failure was a test counting error, another exposed a real logout bug – see TESTING.md §5.)
* Use `console.log(res.body)` in API tests; use the VS Code **Debug current backend test file** config.

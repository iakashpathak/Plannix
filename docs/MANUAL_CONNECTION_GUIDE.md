# Manual Connection Guide

How to connect every technology **by hand**, from an empty folder. Each part follows the same eight headings:
**1 What · 2 Why · 3 How it works · 4 Steps · 5 Commands · 6 Code · 7 Verify · 8 Common errors.**
(Atlas, GitHub and Vercel redesign their dashboards now and then; button names may differ slightly, the concepts don't.)

Contents: [A React + Express](#part-a--react--express) · [B Express + MongoDB Atlas](#part-b--express--mongodb-atlas) · [C Authentication](#part-c--frontend--backend-authentication) · [D Git + GitHub](#part-d--git--github) · [E Testing + debugging](#part-e--testing--debugging) · [F GitHub + Vercel](#part-f--github--vercel)

---
# Part A – React + Express

### 1. What is connected
A React app (browser) and an Express REST API (Node), in the same repository.
### 2. Why
React only renders UI. Data, rules and security live on a server. They talk over HTTP/JSON.
### 3. How it works internally
The browser loads React from Vite (`:5173`). When React calls `axios.get("/api/health")`, the URL is *relative*, so the request goes to `:5173`. Vite's dev proxy sees the `/api` prefix and forwards it to Express (`:5000`), then relays the response. The browser believes it only talked to one origin → no CORS, cookies work.
### 4. Exact steps
1. Create folders and the backend:
2. Create the frontend with Vite.
3. Add a health route to Express.
4. Add the proxy to `vite.config.js`.
5. Create the Axios instance and call the route from a component.
6. Run both servers.
### 5. Commands
```bash
mkdir taskflow && cd taskflow
npm init -y && npm pkg set type=module
npm i express dotenv cookie-parser helmet
npm i -D concurrently
npm create vite@latest client -- --template react      # choose JavaScript
cd client && npm i axios react-router-dom && npm i -D tailwindcss@3 postcss autoprefixer && npx tailwindcss init -p && cd ..
```
### 6. Important code
`server/app.js` (simplified)
```js
import express from "express";
const app = express();
app.use(express.json());
app.get("/api/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
export default app;                 // exported, NOT listening – dev.js / Vercel / tests use it
```
`server/dev.js`
```js
import "dotenv/config";
import app from "./app.js";
app.listen(process.env.PORT || 5000, () => console.log("API on 5000"));
```
`client/vite.config.js`
```js
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": { target: "http://localhost:5000", changeOrigin: true } } },
});
```
`client/src/services/api.js`
```js
import axios from "axios";
export default axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", withCredentials: true });
```
Using it: `const { data } = await api.get("/health");`
Root `package.json` scripts:
```json
"dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
"dev:server": "node --watch server/dev.js",
"dev:client": "npm --prefix client run dev"
```
### 7. Verify
* `curl http://localhost:5000/api/health` → JSON (backend alone works).
* `curl http://localhost:5173/api/health` → the **same** JSON (proxy works).
* Browser DevTools → Network: the request URL is `localhost:5173/api/health`, status 200.
### 8. Common errors
| Error | Cause | Fix |
|---|---|---|
| `ECONNREFUSED` in the Vite terminal / `502` in browser | Express not running or wrong proxy port | Start the API; match `target` port to `PORT` |
| `404` HTML page instead of JSON | Missing `/api` prefix, or route not defined | Check `baseURL` and route path |
| CORS error in console | Calling `http://localhost:5000` directly from the browser | Use relative `/api` (proxy) or set `CLIENT_URL` + `cors()` |
| Proxy changes ignored | Vite config isn't hot-reloaded | Restart `npm run dev` |
| `Cannot use import statement outside a module` | Missing `"type": "module"` | `npm pkg set type=module` |

---
# Part B – Express + MongoDB Atlas

### 1. What is connected
The Express server and a cloud MongoDB database (Atlas) through the Mongoose ODM.
### 2. Why
Data must outlive server restarts (and serverless functions have no disk). MongoDB stores JSON-like documents; Mongoose adds schemas and validation.
### 3. How it works
`mongoose.connect(uri)` opens a TLS connection to the cluster using the credentials inside the URI. The URI (`mongodb+srv://`) is resolved via DNS to the cluster's nodes. Atlas only accepts connections from IPs on its **Network Access** list and from users in **Database Access**. Models (`mongoose.model("Task", schema)`) map to collections (`tasks`).
### 4. Exact steps
1. Sign up at https://www.mongodb.com/cloud/atlas and create an **Organization → Project** (name: TaskFlow).
2. **Create a cluster** → choose the free (M0) tier, a region near you (e.g. Mumbai for India), create.
3. **Database Access → Add New Database User** → authentication: Password. Username e.g. `taskflow_app`; use *Autogenerate* and **copy the password now**. Role: *Read and write to any database* (or restrict to the `taskflow` database).
4. **Network Access → Add IP Address**
   * Local dev: *Add Current IP Address*.
   * Vercel: functions run from changing IPs, so add `0.0.0.0/0` (allow from anywhere). This is acceptable **only because** access still requires the long random DB password; keep the password strong and never commit it. (Vercel's paid static-IP options exist if you need stricter rules.)
5. **Database / Connect → Drivers → Node.js** → copy the connection string.
6. Put it in `.env`, **add the database name** `/taskflow` before the `?`, and replace `<db_password>` (URL-encode special characters: `@`→`%40`, `#`→`%23`, `/`→`%2F`, `:`→`%3A`).
7. Create the models and connect.
### 5. Commands
```bash
npm i mongoose
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # for JWT_SECRET
npm run dev:server          # should print "MongoDB connected"
```
### 6. Important code
`.env`
```
MONGODB_URI=mongodb+srv://taskflow_app:<password>@cluster0.abcde.mongodb.net/taskflow?retryWrites=true&w=majority
```
`server/config/db.js` (serverless-safe: caches the connection)
```js
const cache = global.__mongoose || (global.__mongoose = { promise: null });
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!cache.promise) cache.promise = mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000, bufferCommands: false });
  await cache.promise;
  return mongoose.connection;
}
```
`server/models/Task.js` (schema excerpt)
```js
const taskSchema = new mongoose.Schema({
  owner:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  title:   { type: String, required: true, trim: true, maxlength: 120 },
  priority:{ type: String, enum: ["Low","Medium","High"], default: "Medium" },
}, { timestamps: true });
export default mongoose.models.Task || mongoose.model("Task", taskSchema);   // `models.Task ||` prevents re-compiling on hot reload
```
### 7. Verify
* Terminal: `MongoDB connected`.
* `GET http://localhost:5000/api/health/db` → `{"data":{"database":"connected","name":"taskflow"}}`.
* Register a user in the app → Atlas → **Browse Collections** → `taskflow.users` shows a document whose `password` starts with `$2a$` (a hash, not your password).
* `npm run seed` then refresh Browse Collections to see projects/tasks.
### 8. Common errors
| Error | Cause | Fix |
|---|---|---|
| `MongooseServerSelectionError … Could not connect to any servers … IP that isn't whitelisted` | IP not in Network Access | Add your IP (or `0.0.0.0/0` for Vercel) and wait ~1 min |
| `bad auth : Authentication failed` | Wrong user/password, or user lacks permission | Re-check Database Access; reset password; URL-encode special characters |
| `querySrv ENOTFOUND` / `ECONNREFUSED _mongodb._tcp…` | DNS/SRV blocked (some networks/VPNs) or typo in host | Try another network/DNS; use the non-SRV "standard connection string" from Atlas |
| `MONGODB_URI is not set` | `.env` missing/not loaded | File must be named `.env` in the **project root**; restart the server |
| Data lands in database `test` | No `/taskflow` in the URI | Add the database name before `?` |
| `OverwriteModelError` | Model compiled twice | Use `mongoose.models.X \|\| mongoose.model(...)` |

---
# Part C – Frontend + Backend Authentication

### 1. What is connected
Registration/login forms ↔ Express auth routes ↔ bcrypt ↔ JWT ↔ HTTP-only cookie ↔ protected React routes and protected API routes.
### 2. Why
So each user sees only their own data, and the browser stays logged in across requests/refreshes without storing secrets in JavaScript-readable places.
### 3. How it works
*Register:* validate → hash with bcrypt → store hash → sign JWT → set cookie. *Login:* find user → bcrypt-compare → sign JWT → set cookie. *Every request:* browser attaches cookie → `protect` verifies JWT signature & expiry → loads user → controller filters data by `req.user._id`. *Refresh:* React asks `/auth/me` to learn if the cookie is still valid. *Logout:* server expires the cookie.
### 4. Steps
1. `npm i bcryptjs jsonwebtoken cookie-parser zod`.
2. User model with password hashing hook.
3. Token helpers (sign/verify/cookie options).
4. `register`, `login`, `logout`, `me` controllers + routes.
5. `protect` middleware; apply with `router.use(protect)`.
6. React: `AuthContext` (user, loading, login, register, logout), `ProtectedRoute`, login/register pages.
7. Axios `withCredentials: true`.
### 5. Commands
```bash
npm i bcryptjs jsonwebtoken cookie-parser zod
```
### 6. Code
Hashing (`User.js`)
```js
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);   // 10 = cost factor (2^10 rounds)
  next();
});
userSchema.methods.comparePassword = function (plain) { return bcrypt.compare(plain, this.password); };
```
JWT + cookie (`utils/token.js`)
```js
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7*24*3600*1000 });
```
Middleware (`middleware/auth.js`)
```js
const token = req.cookies.token;                         // needs app.use(cookieParser())
if (!token) throw new ApiError(401, "Not authenticated");
const { id } = jwt.verify(token, process.env.JWT_SECRET); // throws if tampered/expired
req.user = await User.findById(id);
```
Ownership (every controller)
```js
Task.findOne({ _id: req.params.id, owner: req.user._id })  // someone else's id → null → 404
```
React guard (`ProtectedRoute.jsx`)
```jsx
if (loading) return <Spinner/>;
if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
return <Outlet/>;
```
Restore session (`AuthContext.jsx`)
```jsx
useEffect(() => { authService.getMe().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
```
### 7. Verify
1. Register in the UI. DevTools → Application → Cookies: `token` with **HttpOnly ✔**. `document.cookie` in the Console does **not** show it.
2. Refresh the page – still logged in.
3. Visit `/dashboard` in a private window → redirected to `/login`.
4. `curl -i localhost:5000/api/projects` → `401`.
5. Log out → cookie disappears; back button to `/dashboard` redirects to login.
6. Atlas: stored `password` is a `$2a$…` hash.
7. Run `npm test` – `tests/integration/auth.test.js` and `ownership.test.js` automate all of this.
### 8. Common errors
| Symptom | Cause | Fix |
|---|---|---|
| Login succeeds but next request is `401` | Cookie not stored/sent | Axios needs `withCredentials: true`; use the proxy (same origin); on HTTP don't set `secure:true` |
| Works locally, `401` on Vercel | `NODE_ENV`/`JWT_SECRET` missing in Vercel, or token signed with a different secret | Set env vars, redeploy, log in again |
| `req.cookies` is `undefined` | `cookieParser()` not registered before routes | `app.use(cookieParser())` above routers |
| `jwt malformed` / `invalid signature` | Garbage cookie or secret changed | Log out/clear cookies; keep one secret |
| `data and hash arguments required` | `password` not selected (it's `select:false`) | `User.findOne().select("+password")` |
| Refresh logs you out | No `/auth/me` restore, or `loading` ignored | Implement session restore; show spinner while `loading` |
| CORS + cookie problems with a separate API domain | Cross-origin cookies need `credentials`, exact origin, `SameSite=None; Secure` | Prefer same-origin; otherwise set `CLIENT_URL` and change cookie options |

---
# Part D – Git + GitHub

### 1. What is connected
Your local folder (a Git repository) ↔ a remote repository on GitHub.
### 2. Why
History and undo, safe experiments (branches), backup, collaboration (pull requests), and it is what triggers Vercel deployments.
### 3. How it works
Git stores snapshots (*commits*) in a hidden `.git` folder. Files move working directory → *staging area* (`git add`) → *repository* (`git commit`). A *remote* (`origin`) is just a URL; `git push` uploads commits, `git pull` downloads them. A *branch* is a movable pointer to a commit; a *pull request* asks to merge one branch into another.
### 4–5. Steps and commands (each explained)

```bash
# --- one-time setup ---
git --version                                   # confirm Git is installed (https://git-scm.com)
git config --global user.name  "Your Name"      # name stored in every commit
git config --global user.email "you@example.com"# use the same email as your GitHub account
git config --global init.defaultBranch main     # new repos start on "main"

# --- create the repository ---
cd taskflow
git init                                        # creates the hidden .git folder
cat .gitignore                                  # MUST contain node_modules/, .env, dist/ (already provided)
git status                                      # lists untracked files; .env must NOT appear
git add .                                       # stage everything not ignored
git status                                      # double-check: no .env, no node_modules
git commit -m "Initial project setup"           # save the first snapshot
git branch -M main                              # rename current branch to main

# --- create the empty repo on GitHub (website: + → New repository → name "taskflow",
#     leave "Add README/.gitignore" UNCHECKED → Create) then copy its URL ---
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git   # name the remote "origin"
git remote -v                                   # verify the URL
git push -u origin main                         # upload; -u remembers origin/main for future `git push`
```
GitHub no longer accepts account passwords for `git push`. Use **GitHub Desktop**, the **GitHub CLI** (`gh auth login`), a **Personal Access Token** (Settings → Developer settings → Fine-grained tokens, repository contents: read/write) as the password, or an SSH key. Treat tokens like passwords; never put them in files.

**Daily workflow with branches and pull requests**
```bash
git switch -c feature/task-filters              # new branch for one piece of work (older Git: git checkout -b …)
# …edit code…
git add client/src/pages/Tasks.jsx              # stage specific files (or `git add .`)
git commit -m "Add priority filter to tasks page"
git push -u origin feature/task-filters         # publish the branch
# GitHub shows "Compare & pull request" → write a description → Create pull request → review → Merge
git switch main
git pull                                        # download the merged result
git branch -d feature/task-filters              # delete the finished local branch
```
Other essentials: `git log --oneline --graph` (history), `git diff` (unstaged changes), `git restore <file>` (discard edits), `git stash` / `git stash pop` (park changes), `git pull --rebase` (tidy sync), `git merge <branch>` (combine locally).

**Resolving a merge conflict:** Git marks the file with `<<<<<<<`, `=======`, `>>>>>>>`. Edit to keep the right content, delete the markers, then `git add <file>` and `git commit`.

**Suggested commit milestones** (the sandbox build used the same sequence):
1. `Project setup` – structure, configs, `.gitignore`, `.env.example`
2. `Backend: models, auth, routes` · 3. `Database integration` · 4. `Authentication` · 5. `Frontend UI` · 6. `Frontend/backend integration` · 7. `Add tests` · 8. `Deployment config (vercel.json) and docs`

**If you committed a secret by accident:** `git rm --cached .env`, commit, and **rotate the secret** (new Atlas password, new `JWT_SECRET`). Deleting the file later does not remove it from history, so assume it is compromised.
### 6. Code that matters
`.gitignore` (excerpt): `node_modules/`, `.env`, `.env.*`, `!.env.example`, `client/dist/`, `.vercel/`.
### 7. Verify
`git log --oneline` shows commits · GitHub page lists your files · the file list does **not** contain `.env` or `node_modules` · `git status` says "working tree clean".
### 8. Common errors
| Error | Fix |
|---|---|
| `fatal: not a git repository` | Run inside the project folder, or `git init` |
| `remote origin already exists` | `git remote set-url origin <url>` |
| `Authentication failed` / `403` on push | Use a token/SSH/`gh auth login`, not your password |
| `rejected … fetch first` | `git pull --rebase origin main`, then push |
| `refusing to merge unrelated histories` | You ticked "Add README" on GitHub: `git pull origin main --allow-unrelated-histories` |
| `.env` shows in `git status` | `.gitignore` missing/misspelled; if already tracked: `git rm --cached .env` |
| `src refspec main does not match any` | No commit yet or branch named `master`: commit, then `git branch -M main` |

---
# Part E – Testing + Debugging

### 1. What
Automated tests (Vitest, React Testing Library, Supertest) plus interactive debugging tools (Postman, DevTools, VS Code debugger).
### 2. Why
Tests catch regressions and document behaviour; debugging tools show *why* something fails.
### 3. How it works
*Unit tests* call functions directly. *API tests* use Supertest to send real HTTP requests into the Express `app` (no port needed) and a real test database. *Component tests* render React in a simulated DOM (jsdom), act like a user (`userEvent`), and assert on what is visible. Vitest is the runner for both sides.
### 4–5. Steps & commands
```bash
npm i -D vitest supertest                                         # backend (root)
npm --prefix client i -D vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
npm run test:unit        # no DB
npm test                 # + integration (needs MongoDB, name must contain "test")
npm run test:client
npm test -- -t "ownership"      # run tests whose name matches
npx vitest tests/integration/auth.test.js     # watch one file (omit "run")
```
### 6. Code
API test (`tests/integration/ownership.test.js`)
```js
const a = await loginAgent(); const b = await loginAgent();        // agents keep cookies like browsers
const project = await createProject(a.agent);
const res = await b.agent.get(`/api/projects/${project._id}`);
expect(res.status).toBe(404);                                       // B cannot see A's data
```
Invalid input
```js
const res = await request(app).post("/api/auth/register").send({ name: "A", email: "bad", password: "x" });
expect(res.status).toBe(400); expect(res.body.errors.length).toBeGreaterThan(0);
```
Component test (`client/src/__tests__/Login.test.jsx`)
```jsx
await userEvent.click(screen.getByRole("button", { name: /log in/i }));
expect(await screen.findByText("Email is required")).toBeInTheDocument();
```
Database operation test: `tests/integration/*` reads the DB directly (e.g. `User.findOne().select("+password")`) to prove the stored value is a bcrypt hash.

**Postman:** Import `docs/postman/TaskFlow.postman_collection.json` → run **Register**, **Login** (Postman's cookie jar stores the HttpOnly cookie) → run any request. Set the `baseUrl` variable to your Vercel URL to test production.
**Browser DevTools:** *Network* tab → click the request → *Headers* (status, `Set-Cookie`), *Payload*, *Response*. *Application → Cookies* shows `token`. *Console* shows React errors. *React DevTools* extension inspects components/context.
**VS Code debugger:** open `server/controllers/taskController.js`, click left of a line number to set a breakpoint, choose **Debug API (Node)** (F5), make the request, inspect `req.body`, `req.user`.
**MongoDB debugging:** Atlas *Browse Collections*; in code `mongoose.set("debug", true)` prints every query; `mongosh "<uri>"` then `db.tasks.find({owner: ObjectId("…")})`.
### 7. Verify
All suites green; `node scripts/smoke-test.mjs` prints `ALL CHECKS PASSED`.
### 8. Common errors
| Error | Cause | Fix |
|---|---|---|
| `Cannot reach the test database` | No MongoDB running / wrong `MONGODB_URI_TEST` | Start MongoDB or point to an Atlas `…/taskflow_test` DB |
| `Refusing to run tests: database name must contain "test"` | Safety guard | Rename the DB in `MONGODB_URI_TEST` |
| `ReferenceError: document is not defined` | Test runs in node environment | Frontend tests: `environment: "jsdom"` in `client/vite.config.js` |
| `toBeInTheDocument is not a function` | jest-dom not loaded | Import `@testing-library/jest-dom/vitest` in setup file |
| `Unable to find an element with the text` | Async UI | Use `await screen.findBy…` or `waitFor` |
| Tests pass alone, fail together | Shared DB state | Clean collections in `beforeEach` (done in `useTestDb`) |

---
# Part F – GitHub + Vercel

### 1. What
A GitHub repository ↔ a Vercel project that builds the React app, hosts the files on a CDN and runs Express as a serverless function, talking to Atlas.
### 2. Why
Free HTTPS hosting, automatic deployment on every push, preview URLs for branches.
### 3. How it works
Vercel clones the repo, runs `npm install` at the root (backend deps), runs the `buildCommand` (installs and builds the client into `client/dist`), serves `client/dist` as static files, and turns `api/index.js` into a function. `vercel.json` rewrites: `/api/*` → the function; any other non-file path → `/index.html` (so refreshing `/tasks` works with React Router). Environment variables you enter in the dashboard are injected into the function at runtime. Each `git push` to `main` triggers a new **production** deployment; other branches/PRs get **preview** deployments.
### 4. Exact steps
1. Complete Part D (code on GitHub) and Part B (Atlas user + Network Access `0.0.0.0/0`).
2. https://vercel.com → sign up with GitHub → **Add New… → Project** → pick the `taskflow` repo → **Import** (authorize the GitHub app for that repo if asked).
3. **Configure Project:** *Framework Preset*: **Other**. *Root Directory*: `./` (the repo root). Leave Build/Output overrides empty – `vercel.json` already sets `buildCommand`, `installCommand`, `outputDirectory`. (If you override them, use: Build `npm --prefix client install --include=dev && npm --prefix client run build`, Output `client/dist`.)
4. **Environment Variables** (before deploying):

| Name | Value | Notes |
|---|---|---|
| `MONGODB_URI` | your Atlas URI incl. `/taskflow` | Production (+ Preview if you want previews to work) |
| `JWT_SECRET` | 48+ random bytes (hex) | Different from local |
| `NODE_ENV` | `production` | Enables `Secure` cookies (Vercel also sets it for builds) |
| `VITE_API_URL` | *leave unset* | Same-origin `/api` is used |
| `CLIENT_URL` | *leave unset* | Only for cross-origin setups |

5. Click **Deploy**; watch the build log.
6. Open the `https://<project>.vercel.app` URL and verify (below).
7. Future updates: `git push` → Vercel redeploys automatically. Changing an env var requires **Redeploy** to take effect.
### 5. Commands (optional CLI route)
```bash
npm i -g vercel
vercel login
vercel            # preview deploy (links the project)
vercel --prod     # production deploy
vercel env add MONGODB_URI
vercel logs <deployment-url>
```
### 6. Code (`vercel.json`)
```json
{
  "framework": null,
  "installCommand": "npm install",
  "buildCommand": "npm --prefix client install && npm --prefix client run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "functions": { "api/index.js": { "maxDuration": 15 } }
}
```
`api/index.js`: `import app from "../server/app.js"; export default app;`
### 7. Verify
1. `https://<project>.vercel.app/api/health` → `{"success":true,…}`
2. `https://<project>.vercel.app/api/health/db` → `"database":"connected"` (if `503`: Atlas Network Access or URI).
3. Open the site, register, create a project and a task, refresh on `/tasks` (must not 404), log out/in.
4. Run `BASE_URL=https://<project>.vercel.app node scripts/smoke-test.mjs` – it also checks the `Secure` cookie flag over HTTPS.
5. Atlas → Browse Collections shows the new user/project/task.
6. Vercel → project → **Logs** for runtime errors.
### 8. Common errors
| Symptom | Cause | Fix |
|---|---|---|
| Build fails: `vite: command not found` / `Cannot find module 'vite'` | Client dev dependencies were omitted in production mode | Use `npm --prefix client install --include=dev` in `buildCommand` |
| `404` on `/tasks` after refresh | Missing SPA rewrite | Keep the second rewrite in `vercel.json` |
| `/api/...` returns the React `index.html` | API rewrite missing/ordered after the SPA rule | Keep the `/api/(.*)` rule **first** |
| `500 FUNCTION_INVOCATION_FAILED` | Runtime crash (missing env var, import error) | Read the function log; set `MONGODB_URI`/`JWT_SECRET`, redeploy |
| `503 Database is unavailable` | Atlas blocks Vercel's IPs, or wrong URI | Network Access `0.0.0.0/0`; verify user/password |
| Login works but you're logged out immediately | Wrong/missing `JWT_SECRET`, or cookie blocked | Set secret; ensure site uses HTTPS and same origin |
| Env var change has no effect | Old deployment | Redeploy |
| `Error [ERR_MODULE_NOT_FOUND]` | Import path missing `.js` extension (ESM) | Always write `./file.js` in server imports |
| Slow first request | Cold start + DB connect | Normal on free tier; connection is cached afterwards |
| 429 "Too many attempts" while testing | Rate limiter | Wait 15 min; limit is per instance and best-effort |

**Understanding automatic deployment:** the Vercel GitHub app listens for pushes. Push to `main` → build → atomic switch of the production URL (old version stays until the new one is ready; you can *Instant Rollback* in the dashboard). Push to another branch or open a PR → a unique preview URL appears on the PR.

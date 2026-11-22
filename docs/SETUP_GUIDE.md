# Setup Guide – Running Plannix Locally

Follow this top to bottom. Each step says what to expect, so you know it worked.

## 1. Install the tools

| Tool | Check | Get it |
|---|---|---|
| Node.js 18+ (LTS) | `node -v` → `v18…` or newer | https://nodejs.org |
| npm (comes with Node) | `npm -v` | – |
| Git | `git --version` | https://git-scm.com |
| VS Code (recommended) | – | https://code.visualstudio.com |
| Postman (optional) | – | https://www.postman.com/downloads |

## 2. Unzip and install dependencies

```bash
unzip Plannix_FullStack_MiniProject.zip      # or use your file manager
cd taskflow
npm run install:all
```
`install:all` runs `npm install` in the project root (backend packages) and then in `client/` (frontend packages). You should see two `node_modules` folders afterwards.

## 3. Create a MongoDB database

You have two options. **Atlas is recommended** because production uses it too.

### Option A – MongoDB Atlas (free)
Follow [MANUAL_CONNECTION_GUIDE.md → Part B](MANUAL_CONNECTION_GUIDE.md#part-b--express--mongodb-atlas) to create the cluster, database user, network access rule and copy the connection string.

### Option B – local MongoDB
Install MongoDB Community Server (version 4.2+ is required by Mongoose 8; 6.0+ recommended), start it, and use
`MONGODB_URI=mongodb://127.0.0.1:27017/taskflow`.

## 4. Environment variables

```bash
cp .env.example .env        # Windows (cmd): copy .env.example .env
```
Edit `.env`:

| Variable | Required | Meaning | Example |
|---|---|---|---|
| `MONGODB_URI` | ✅ | Where MongoDB lives (+ database name `taskflow`) | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority` |
| `JWT_SECRET` | ✅ | Secret used to sign login tokens. Long, random, private | output of `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | – | Token lifetime (default `7d`) | `7d` |
| `NODE_ENV` | – | `development` locally, `production` on Vercel | `development` |
| `PORT` | – | API port locally (default `5000`) | `5000` |
| `CLIENT_URL` | – | Only if the frontend is on a *different* origin than the API (adds CORS). Leave empty normally | – |
| `BCRYPT_ROUNDS` | – | bcrypt cost (default `10`) | `10` |
| `MONGODB_URI_TEST` | for tests | A database whose name contains `test` (**gets wiped**) | `mongodb://127.0.0.1:27017/taskflow_test` |

`client/.env.example` has `VITE_API_URL` – leave it **empty**: the app then calls `/api` on its own origin (Vite proxy in dev, Vercel rewrite in production).

> 🔒 `.env` is listed in `.gitignore`. Never commit it, paste it in chat, or screenshot it. If a secret leaks: rotate the Atlas password and generate a new `JWT_SECRET`.

## 5. (Optional) load demo data

```bash
npm run seed
```
Creates `demo@plannix.dev` / `Demo1234` with 3 projects and 7 tasks (including an overdue one). Safe to re-run: it recreates the demo user's data.

## 6. Start the app

```bash
npm run dev
```
Expected output (colours aside):
```
[api] MongoDB connected
[api] Plannix API listening on http://localhost:5000
[web]   VITE v5.x  ready in …ms
[web]   ➜  Local:   http://localhost:5173/
```
Open **http://localhost:5173** and register (or log in with the demo user).

**Quick API check:** open http://localhost:5000/api/health → `{"success":true,"data":{"status":"ok",…}}`, and http://localhost:5000/api/health/db → `"database":"connected"`.

## 7. Run the tests

```bash
npm run test:unit      # backend, no database needed
npm test               # backend unit + integration (needs MongoDB, see below)
npm run test:client    # frontend
```
Integration tests wipe the database in `MONGODB_URI_TEST` (default `mongodb://127.0.0.1:27017/taskflow_test`) – the test setup refuses to run unless the database name contains `test`. Without a local MongoDB, create a second Atlas database URI ending in `/taskflow_test` and export it:

```bash
# macOS / Linux
MONGODB_URI_TEST="mongodb+srv://…/taskflow_test?retryWrites=true&w=majority" npm test
# Windows PowerShell
$env:MONGODB_URI_TEST="mongodb+srv://…/taskflow_test?retryWrites=true&w=majority"; npm test
```

## 8. Make yourself an admin (optional)

Register normally, then:
```bash
npm run make-admin -- you@example.com
```
Admins can call `GET /api/admin/users` and `GET /api/admin/stats` (there is no admin UI page; use Postman).

## 9. Manual frontend ↔ backend integration (what `npm run dev` automates)

If you want to run the two halves in separate terminals:

```bash
# Terminal 1 – backend
npm run dev:server           # http://localhost:5000
# Terminal 2 – frontend
npm run dev:client           # http://localhost:5173  (proxies /api -> :5000)
```
The proxy is configured in `client/vite.config.js`. To understand and rebuild it yourself, read [MANUAL_CONNECTION_GUIDE.md → Part A](MANUAL_CONNECTION_GUIDE.md#part-a--react--express).

## 10. VS Code debugging

`.vscode/launch.json` provides three launch configurations: **Debug API (Node)** (set breakpoints in controllers, press F5), **Debug current backend test file**, and **Debug React in Chrome** (start `npm run dev` first).

## Troubleshooting quick list

| Symptom | Likely fix |
|---|---|
| `MongoDB connection failed … ECONNREFUSED` | Local MongoDB not running, or wrong `MONGODB_URI` |
| `MongooseServerSelectionError … IP … not whitelisted` | Atlas → Network Access → add your IP |
| `bad auth : Authentication failed` | Wrong DB username/password (special characters in the password must be URL-encoded) |
| Browser shows "Cannot reach the server" | API not running on port 5000 |
| Blank page after deploy | See [DEBUGGING.md](DEBUGGING.md) |

More in [DEBUGGING.md](DEBUGGING.md).

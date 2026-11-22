# TaskFlow API Documentation

Base URL: `http://localhost:5000/api` (local) · `https://<your-app>.vercel.app/api` (production).
Format: JSON. Authentication: HTTP-only cookie `token` (set by login/register), or `Authorization: Bearer <jwt>` (handy in Postman).

**Envelope** – success: `{ "success": true, "data": { … } }` · failure: `{ "success": false, "message": "…", "errors": [{ "field": "email", "message": "…" }] }`

**Status codes:** 200 OK · 201 Created · 400 validation/bad id · 401 not authenticated · 403 forbidden (role) · 404 not found *or not yours* · 409 duplicate · 429 too many attempts · 503 database unavailable.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | – | Liveness (no DB) |
| GET | `/health/db` | – | Pings MongoDB |
| POST | `/auth/register` | – | Create account + log in |
| POST | `/auth/login` | – | Log in |
| POST | `/auth/logout` | – | Clear cookie |
| GET | `/auth/me` | ✅ | Current user |
| PUT | `/users/profile` | ✅ | Update name/email |
| PUT | `/users/password` | ✅ | Change password |
| GET | `/dashboard` | ✅ | Stats, upcoming, activity |
| GET/POST | `/projects` | ✅ | List / create |
| GET/PUT/DELETE | `/projects/:id` | ✅ | Read / update / delete (cascades tasks) |
| GET/POST | `/tasks` | ✅ | List (filter/search/sort/page) / create |
| GET/PUT/DELETE | `/tasks/:id` | ✅ | Read / update / delete |
| GET | `/admin/users` | ✅ admin | All users (no hashes) |
| GET | `/admin/stats` | ✅ admin | System totals |

---
## Auth

### POST `/auth/register`
```json
{ "name": "Asha Verma", "email": "asha@example.com", "password": "Passw0rd123" }
```
Rules: name 2–50 chars; valid email (stored lowercase); password 8–72 chars with ≥1 letter and ≥1 number. A `role` field in the body is ignored.
**201** → `Set-Cookie: token=…; HttpOnly; SameSite=Lax; (Secure in production)`
```json
{ "success": true, "data": { "user": { "_id": "665f…", "name": "Asha Verma", "email": "asha@example.com", "role": "user", "createdAt": "2030-01-01T10:00:00.000Z", "updatedAt": "…" } } }
```
Errors: **400** validation, **409** `An account with this email already exists`, **429** rate limit (30 / 15 min per IP, per instance).

### POST `/auth/login`
`{ "email": "asha@example.com", "password": "Passw0rd123" }` → **200** same shape as register + cookie.
Wrong email **or** password → **401** `Invalid email or password` (identical message on purpose).

### POST `/auth/logout` → **200** `{ "data": { "message": "Logged out" } }`, cookie expired.
### GET `/auth/me` → **200** `{ "data": { "user": {…} } }` · **401** if no/invalid/expired cookie.

## Users
### PUT `/users/profile` — body: any of `{ "name", "email" }` (at least one). **200** `{ "data": { "user" } }` · **409** email taken.
### PUT `/users/password` — `{ "currentPassword": "…", "newPassword": "…" }`. **200** (fresh cookie issued) · **400** wrong current password / weak or identical new password.

## Dashboard
### GET `/dashboard`
```json
{ "success": true, "data": {
  "stats": { "totalProjects": 3, "totalTasks": 7, "completedTasks": 2, "pendingTasks": 4, "inProgressTasks": 1, "overdueTasks": 2, "completionRate": 29 },
  "recentActivities": [ { "_id": "…", "action": "completed", "entityType": "task", "entityName": "Write report", "createdAt": "…" } ],
  "upcomingTasks": [ { "_id": "…", "title": "Prepare demo slides", "priority": "Medium", "status": "Pending", "dueDate": "…", "project": { "_id": "…", "name": "Semester Project" } } ]
} }
```

## Projects
Fields: `name` (1–100, required), `description` (≤500), `status` ∈ `Active | On Hold | Completed` (default `Active`).

### GET `/projects?q=&status=` → each project includes `taskCounts`
```json
{ "data": { "projects": [ { "_id": "…", "owner": "…", "name": "Semester Project", "description": "", "status": "Active",
  "taskCounts": { "total": 3, "pending": 1, "inProgress": 1, "completed": 1 }, "createdAt": "…", "updatedAt": "…" } ] } }
```
### POST `/projects` → **201** `{ "data": { "project" } }` · **400** invalid
### GET `/projects/:id` → **200** (with `taskCounts`) · **404** missing/not yours · **400** malformed id
### PUT `/projects/:id` — any subset of fields (≥1) → **200**
### DELETE `/projects/:id` → **200** `{ "data": { "message": "Project deleted", "deletedTasks": 2 } }`

## Tasks
Fields: `title` (1–120, required), `description` (≤1000), `project` (ObjectId of **your** project, required), `priority` ∈ `Low | Medium | High` (default Medium), `status` ∈ `Pending | In Progress | Completed` (default Pending), `dueDate` (`YYYY-MM-DD`/ISO, `null` or `""` clears it). `completedAt` is set automatically.

### GET `/tasks`
| Query | Meaning |
|---|---|
| `q` | case-insensitive match in title/description (literal text, regex chars escaped) |
| `status`, `priority`, `project` | exact filters |
| `sort` | `newest` (default) · `oldest` · `due` · `priority` (High→Low) |
| `page`, `limit` | default 1 / 50, limit max 100 |
```json
{ "data": { "tasks": [ { "_id": "…", "title": "Write report", "status": "Pending", "priority": "High", "dueDate": "2030-12-31T00:00:00.000Z",
  "project": { "_id": "…", "name": "Semester Project", "status": "Active" }, "owner": "…" } ],
  "pagination": { "page": 1, "limit": 50, "total": 1, "pages": 1 } } }
```
### POST `/tasks`
```json
{ "title": "Write report", "project": "665f1c2e8f1b2a0012ab34cd", "priority": "High", "status": "Pending", "dueDate": "2030-12-31" }
```
→ **201** `{ "data": { "task" } }` · **400** invalid / project not found (including someone else's project).
### GET / PUT / DELETE `/tasks/:id` — **404** if missing or not yours. PUT takes any subset (≥1 field); moving a task into a project you don't own → **400**.

## Admin (role `admin`)
`GET /admin/users` → `{ "data": { "users": [ … ] } }` · `GET /admin/stats` → `{ "data": { "users": 5, "projects": 9, "tasks": 41 } }`. Normal users get **403**. Promote with `npm run make-admin -- email`.

## cURL examples (cookie jar)
```bash
curl -c jar.txt -H "Content-Type: application/json" -d '{"email":"demo@taskflow.dev","password":"Demo1234"}' http://localhost:5000/api/auth/login
curl -b jar.txt http://localhost:5000/api/projects
curl -b jar.txt -H "Content-Type: application/json" -d '{"name":"My project"}' http://localhost:5000/api/projects
```
A ready-made Postman collection is in `docs/postman/TaskFlow.postman_collection.json` (import it, set `baseUrl`).

# Testing

> **Rule followed:** nothing here is marked ✅ unless it was executed and passed. Raw outputs are saved in `docs/test-results/`.

## 1. Environment used for the recorded results

| Item | Value |
|---|---|
| Node.js | v22 |
| Database for integration/smoke tests | **local MongoDB 8.0.23** (not Atlas) |
| Backend runner | Vitest 2 + Supertest 7 |
| Frontend runner | Vitest 2 + React Testing Library 16 (jsdom) |

Why local and not Atlas: the sandbox has no access to your Atlas account. MongoDB 8.0 is current, so driver/query behaviour matches what Atlas serves. (A first attempt with MongoDB 4.0 failed, correctly: Mongoose 8's driver requires MongoDB ≥ 4.2.)

## 2. Summary

| Suite | Command | Result |
|---|---|---|
| Backend unit (no DB) | `npm run test:unit` | ✅ 34 / 34 passed |
| Backend integration (real MongoDB) | `npm run test:api` | ✅ 67 / 67 passed |
| **Backend total** | `npm test` | ✅ **101 / 101** in 9 files |
| **Frontend total** | `npm run test:client` | ✅ **41 / 41** in 9 files |
| Production build | `npm run build` | ✅ succeeded (1670 modules; JS 276 kB / 89 kB gzip, CSS 21 kB) |
| End-to-end smoke test, direct to Express | `node scripts/smoke-test.mjs` | ✅ 22 / 22 checks |
| Same, through the Vite dev proxy | `BASE_URL=http://localhost:5173 …` | ✅ 22 / 22 checks |
| Same, via Vercel entry `api/index.js` with `NODE_ENV=production` | `BASE_URL=http://localhost:5002 …` | ✅ 22 / 22 checks; `Set-Cookie` confirmed `HttpOnly; Secure; SameSite=Lax`, HSTS header present |

## 3. Requirement → test traceability

| Requirement | Where tested | Expected | Actual |
|---|---|---|---|
| Frontend build | `npm run build` | build succeeds | ✅ pass |
| Backend startup | smoke A/B (real `server/dev.js`), `/api/health` | server answers | ✅ pass |
| API endpoints | `tests/integration/*`, smoke | correct status + body | ✅ pass |
| User registration | `auth.test.js` | 201, user stored, cookie set | ✅ pass |
| Login / logout | `auth.test.js`, `AuthContext.test.jsx`, `Login.test.jsx` | cookie set / cleared, `/me` 401 after logout | ✅ pass |
| Password hashing | `password.test.js`, `auth.test.js` (reads DB) | stored value is `$2a$…`, differs per hash, verifies | ✅ pass |
| Auth middleware | `middleware.test.js`, `auth.test.js` | 401 no/forged/expired token, Bearer accepted | ✅ pass |
| Protected routes (API) | `projects.test.js` "auth required" | 401 when anonymous | ✅ pass |
| Protected routes (React) | `ProtectedRoute.test.jsx`, `App.test.jsx` | redirect to `/login`, no flash while loading | ✅ pass |
| Project CRUD | `projects.test.js` | create/read/update/delete, cascade delete | ✅ pass |
| Task CRUD + search/filter/sort/pagination | `tasks.test.js` | correct results | ✅ pass |
| User data ownership | `ownership.test.js` | other user gets 404, data unchanged, cannot attach tasks to others' projects | ✅ pass |
| Role-based authorization | `ownership.test.js`, `account.test.js` | user 403, admin 200, no hashes leaked | ✅ pass |
| Invalid inputs | `schemas.test.js`, API tests (`it.each`), form tests | 400 + field errors / inline messages | ✅ pass |
| Error handling | `middleware.test.js`, API tests | consistent JSON, no stack leak | ✅ pass |
| Mass assignment (`role`, `owner` in body) | `auth.test.js`, `projects.test.js` | ignored | ✅ pass |
| Regex injection in search | `projects.test.js` | `.*` matches nothing | ✅ pass |

## 4. NOT tested (be aware)

| Not tested | Why | How you can verify |
|---|---|---|
| Connection to **your MongoDB Atlas** cluster | needs your credentials | `GET /api/health/db`, `smoke-test.mjs` against your deployment |
| **Vercel** build, rewrites in `vercel.json`, function limits | needs your Vercel account | follow DEPLOYMENT.md, then run the smoke test against the live URL |
| `Secure` cookie over **real HTTPS** | sandbox is plain HTTP (header was verified, transport not) | smoke test on the `https://` URL checks the flag |
| Real **browser rendering**, responsive layout, fonts, keyboard/screen-reader behaviour | no browser in the sandbox | open the app, test at 375 px wide, run Lighthouse |
| Rate limiter (disabled when `NODE_ENV=test`) | would break the suite | 31 rapid bad logins should return 429 |
| CORS path (`CLIENT_URL` set) | not the default architecture | manual |
| Concurrent users / load / cold-start timing | out of scope | – |
| Pushing to GitHub | needs your account | DEPLOYMENT.md |

## 5. Issues found while testing (and what happened)

1. **Test arithmetic error (not an app bug):** a dashboard test expected 2 pending tasks; the data had 1. Corrected the test.
2. **Real bug fixed:** `AuthContext.logout` re-threw network errors, so if the logout request failed the user stayed on the page. Found via an unhandled-rejection report in the frontend tests; now logout always clears local state.
3. Test infrastructure: MongoDB 4.0 was rejected by Mongoose 8; switched to 8.0.

## 6. How to run everything yourself

```bash
npm run install:all
npm run test:unit                       # needs nothing
MONGODB_URI_TEST="mongodb://127.0.0.1:27017/taskflow_test" npm test     # needs MongoDB
npm run test:client
npm run build
# end-to-end (two terminals)
npm run dev                             # terminal 1
BASE_URL=http://localhost:5173 node scripts/smoke-test.mjs   # terminal 2
```

### Manual test checklist (do in a browser)
- [ ] Register with a weak password → inline error; register properly → lands on dashboard
- [ ] Refresh → still logged in; log out → `/dashboard` redirects to login
- [ ] Create project → appears with 0/0 tasks; create task → counts and dashboard update
- [ ] Change a task status inline → toast; progress bar changes
- [ ] Filter/search/sort tasks; set a past due date → "Overdue" in red
- [ ] Delete project → confirmation mentions its tasks; tasks gone
- [ ] Profile: update name, change password (wrong current password shows error)
- [ ] Open the site on a phone width: sidebar becomes a drawer
- [ ] Register a second account → cannot see the first account's data

---

## 7. Detailed results (generated from the saved runs)

### 7.1 Backend – 101 tests

**`tests/integration/auth.test.js`** – 21 tests, all ✅

- ✅ health > GET /api/health responds ok
- ✅ health > GET /api/health/db confirms the database connection
- ✅ POST /api/auth/register > creates a user, hashes the password, and sets an HTTP-only cookie
- ✅ POST /api/auth/register > rejects duplicate emails (409), case-insensitively
- ✅ POST /api/auth/register > returns 400 with field errors for invalid input ({"name":"A"} – short name)
- ✅ POST /api/auth/register > returns 400 with field errors for invalid input ({"email":"bad"} – bad email)
- ✅ POST /api/auth/register > returns 400 with field errors for invalid input ({"password":"short1"} – short password)
- ✅ POST /api/auth/register > returns 400 with field errors for invalid input ({"password":"alllettersss"} – password without number)
- ✅ POST /api/auth/register > ignores attempts to self-assign the admin role (mass assignment)
- ✅ POST /api/auth/register > returns 400 for malformed JSON
- ✅ POST /api/auth/login > logs in with correct credentials and sets a cookie
- ✅ POST /api/auth/login > rejects a wrong password with 401 and a generic message
- ✅ POST /api/auth/login > gives the SAME message for an unknown email (no user enumeration)
- ✅ POST /api/auth/login > returns 400 when fields are missing
- ✅ session: /me and logout > GET /api/auth/me returns the user when the cookie is present
- ✅ session: /me and logout > GET /api/auth/me returns 401 without a cookie
- ✅ session: /me and logout > rejects a forged / invalid token
- ✅ session: /me and logout > accepts an Authorization: Bearer token (Postman style)
- ✅ session: /me and logout > logout clears the cookie and the session stops working
- ✅ session: /me and logout > returns 401 if the user was deleted after the token was issued
- ✅ unknown routes > returns a JSON 404

**`tests/integration/tasks.test.js`** – 17 tests, all ✅

- ✅ Task CRUD > creates a task with defaults
- ✅ Task CRUD > stores priority, status and due date
- ✅ Task CRUD > rejects invalid input {"title":""} (empty title)
- ✅ Task CRUD > rejects invalid input {"priority":"Urgent"} (bad priority)
- ✅ Task CRUD > rejects invalid input {"status":"Done"} (bad status)
- ✅ Task CRUD > rejects invalid input {"dueDate":"tomorrow-ish"} (bad date)
- ✅ Task CRUD > rejects invalid input {"project":"abc"} (bad project id)
- ✅ Task CRUD > requires an existing project
- ✅ Task CRUD > updates a task, sets/clears completedAt, and can clear the due date
- ✅ Task CRUD > rejects an empty update body
- ✅ Task CRUD > gets one task and deletes it
- ✅ Task search, filter, sort, pagination > filters by status, priority and project
- ✅ Task search, filter, sort, pagination > searches title and description, case-insensitively
- ✅ Task search, filter, sort, pagination > combines filters
- ✅ Task search, filter, sort, pagination > sorts by due date and by priority (High first)
- ✅ Task search, filter, sort, pagination > paginates
- ✅ Task search, filter, sort, pagination > rejects invalid query params with 400

**`tests/integration/account.test.js`** – 8 tests, all ✅

- ✅ dashboard > returns zeros for a brand-new user
- ✅ dashboard > computes totals, completion rate, overdue and activity feed
- ✅ profile > updates name and email
- ✅ profile > rejects an email that belongs to another user (409)
- ✅ profile > validates input and requires login
- ✅ change password > changes the password: old one stops working, new one works, stored as a hash
- ✅ change password > rejects a wrong current password (400) and weak new passwords
- ✅ admin role > lets an admin list users (without password hashes) and see system stats

**`tests/integration/projects.test.js`** – 13 tests, all ✅

- ✅ auth required > get /api/projects returns 401 without login
- ✅ auth required > post /api/projects returns 401 without login
- ✅ auth required > get /api/tasks returns 401 without login
- ✅ auth required > post /api/tasks returns 401 without login
- ✅ auth required > get /api/dashboard returns 401 without login
- ✅ Project CRUD > creates a project owned by the logged-in user
- ✅ Project CRUD > cannot choose another owner via the request body
- ✅ Project CRUD > validates input (400)
- ✅ Project CRUD > lists projects with task counts, newest first, with search + status filter
- ✅ Project CRUD > search treats regex characters literally (no regex injection)
- ✅ Project CRUD > gets, updates and deletes a project
- ✅ Project CRUD > deleting a project also deletes its tasks
- ✅ Project CRUD > returns 400 for a malformed id and 404 for a missing one

**`tests/unit/schemas.test.js`** – 13 tests, all ✅

- ✅ registerSchema > accepts valid data and normalises the email
- ✅ registerSchema > rejects invalid email
- ✅ registerSchema > rejects short password
- ✅ registerSchema > rejects password without a number
- ✅ registerSchema > rejects password without a letter
- ✅ registerSchema > rejects missing fields
- ✅ loginSchema > requires email and password
- ✅ passwordChangeSchema > rejects when new password equals current
- ✅ task schemas > applies defaults on create
- ✅ task schemas > rejects invalid priority, status and project id
- ✅ task schemas > converts dueDate strings to Date, '' and null to null
- ✅ task schemas > update requires at least one field and does not inject defaults
- ✅ task schemas > query schema coerces page/limit and caps limit

**`tests/integration/ownership.test.js`** – 8 tests, all ✅

- ✅ data ownership & authorization > lists only the caller's own projects and tasks
- ✅ data ownership & authorization > returns 404 (not 403) when reading someone else's project or task
- ✅ data ownership & authorization > cannot update someone else's project or task
- ✅ data ownership & authorization > cannot delete someone else's project or task
- ✅ data ownership & authorization > cannot create a task inside someone else's project
- ✅ data ownership & authorization > cannot move your own task into someone else's project
- ✅ data ownership & authorization > dashboard statistics only count the caller's data
- ✅ data ownership & authorization > regular users get 403 on admin routes

**`tests/unit/middleware.test.js`** – 9 tests, all ✅

- ✅ protect middleware > rejects requests without a token (401) before touching the database
- ✅ protect middleware > rejects a malformed token (401)
- ✅ authorize middleware > allows a matching role
- ✅ authorize middleware > blocks other roles with 403
- ✅ errorHandler > maps ApiError to its status
- ✅ errorHandler > maps duplicate key errors to 409
- ✅ errorHandler > maps CastError to 400
- ✅ errorHandler > maps malformed JSON to 400
- ✅ errorHandler > maps unknown errors to 500 without leaking internals

**`tests/unit/token.test.js`** – 7 tests, all ✅

- ✅ JWT helpers > signs and verifies a token containing the user id
- ✅ JWT helpers > rejects a tampered token
- ✅ JWT helpers > rejects a token signed with another secret
- ✅ JWT helpers > rejects an expired token
- ✅ cookie options > is httpOnly + lax in every environment
- ✅ cookie options > is NOT secure outside production (so http://localhost works)
- ✅ cookie options > is secure in production (HTTPS only)

**`tests/unit/password.test.js`** – 5 tests, all ✅

- ✅ password hashing (bcrypt) > produces a hash that differs from the plain password
- ✅ password hashing (bcrypt) > generates a different hash each time (random salt)
- ✅ password hashing (bcrypt) > verifies correct and incorrect passwords
- ✅ password hashing (bcrypt) > User.comparePassword uses the stored hash
- ✅ password hashing (bcrypt) > User JSON output never contains the password

### 7.2 Frontend – 41 tests

**`src/__tests__/Register.test.jsx`** – 5 tests, all ✅

- ✅ validateRegister > accepts valid values
- ✅ validateRegister > flags short names, bad emails, weak passwords and mismatches
- ✅ Register page > blocks submission when passwords differ
- ✅ Register page > calls register (without the confirm field) when valid
- ✅ Register page > shows inline server field errors (e.g. duplicate email)

**`src/__tests__/Dashboard.test.jsx`** – 3 tests, all ✅

- ✅ Dashboard page > renders greeting, stats, activity and project progress from the API
- ✅ Dashboard page > shows an empty state for a brand-new account
- ✅ Dashboard page > shows an error message with a retry button when the API fails

**`src/__tests__/TaskForm.test.jsx`** – 4 tests, all ✅

- ✅ TaskForm > requires a title and a project
- ✅ TaskForm > submits a clean payload with defaults
- ✅ TaskForm > pre-fills when editing and pre-selects the default project when creating
- ✅ TaskForm > shows a server error and re-enables the button

**`src/__tests__/format.test.js`** – 11 tests, all ✅

- ✅ getErrorMessage > prefers the API message
- ✅ getErrorMessage > explains network failures
- ✅ getErrorMessage > explains timeouts
- ✅ getErrorMessage > falls back for unknown errors
- ✅ getFieldErrors > maps API validation errors to a field->message object (first error wins)
- ✅ getFieldErrors > returns {} when there are none
- ✅ dates > formats a due date, with a placeholder when missing
- ✅ dates > converts to the yyyy-mm-dd format used by <input type=date>
- ✅ dates > detects overdue tasks (completed and undated tasks are never overdue)
- ✅ dates > formats relative time
- ✅ dates > greets by time of day

**`src/__tests__/Login.test.jsx`** – 4 tests, all ✅

- ✅ Login page > shows validation errors and does not call the API when the form is empty
- ✅ Login page > rejects a malformed email
- ✅ Login page > submits trimmed credentials and navigates to the dashboard on success
- ✅ Login page > shows the server's error message when login fails

**`src/__tests__/AuthContext.test.jsx`** – 3 tests, all ✅

- ✅ AuthProvider > restores the session from /auth/me on first load
- ✅ AuthProvider > is anonymous when /auth/me fails with 401
- ✅ AuthProvider > login stores the user and logout clears it (even if the request fails)

**`src/__tests__/ProtectedRoute.test.jsx`** – 4 tests, all ✅

- ✅ route guards > redirects anonymous visitors from a protected page to /login
- ✅ route guards > shows the protected page to a logged-in user
- ✅ route guards > shows a loading state while the session is being checked (no flash of /login)
- ✅ route guards > sends a logged-in user away from /login to the dashboard

**`src/__tests__/App.test.jsx`** – 3 tests, all ✅

- ✅ App routing (anonymous visitor) > redirects /dashboard to the login page
- ✅ App routing (anonymous visitor) > shows the registration page
- ✅ App routing (anonymous visitor) > shows a 404 page for unknown URLs

**`src/__tests__/Badges.test.jsx`** – 4 tests, all ✅

- ✅ badges > renders the task status text
- ✅ badges > renders the priority text
- ✅ FlowBar > describes the split accessibly
- ✅ FlowBar > handles zero tasks without crashing

### 7.3 End-to-end smoke checks (identical list passed in all three modes)

- ✅ health endpoint responds
- ✅ database connection works (/api/health/db)
- ✅ protected route rejects anonymous request (401)
- ✅ register user A (201)
- ✅ auth cookie is HttpOnly
- ✅ duplicate email rejected (409)
- ✅ wrong password rejected (401)
- ✅ login works (200)
- ✅ session restored via cookie (/auth/me)
- ✅ create project (201)
- ✅ create task (201)
- ✅ update task status (200)
- ✅ search + filter finds the task
- ✅ dashboard stats are correct
- ✅ register user B (201)
- ✅ user B cannot read user A's project (404)
- ✅ user B cannot edit user A's task (404)
- ✅ user B cannot delete user A's project (404)
- ✅ normal user blocked from admin API (403)
- ✅ owner deletes project and its tasks (200)
- ✅ logout (200)
- ✅ session is gone after logout (401)

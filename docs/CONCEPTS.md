# Concepts, Explained Through Plannix

Each concept is tied to a real file so you can open it and see it.

**Client–server architecture** – The browser (client) shows UI and asks; the server holds rules and data. React in `client/` never touches MongoDB; it asks Express at `/api`. *See* `client/src/services/*.js` ↔ `server/routes/*.js`.

**HTTP & REST** – HTTP is request/response with a *method*, *URL*, *headers*, optional *body*, and a *status code*. REST names things (`/projects/:id`) and uses verbs: `GET` read, `POST` create, `PUT` update, `DELETE` remove. *See* `server/routes/projectRoutes.js`.

**JSON** – Text format both sides use: `{"title":"Write report","priority":"High"}`. `express.json()` in `server/app.js` parses it into `req.body`; `res.json()` writes it.

**CRUD** – Create/Read/Update/Delete = the four basic data operations = `POST/GET/PUT/DELETE`. *See* `server/controllers/taskController.js`: `createTask`, `listTasks/getTask`, `updateTask`, `deleteTask`.

**MVC** – *Model* = data + rules (`server/models/*`), *View* = what the user sees (React, since this is a JSON API), *Controller* = glue logic (`server/controllers/*`). Routes map URLs to controllers. Benefit: you can change the UI or database without rewriting everything.

**Middleware** – A function `(req,res,next)` that runs *before* the controller and either handles the request or calls `next()`. Chain for creating a task: `protect → validate → createTask`. *See* `server/middleware/`.

**Centralized error handling** – Controllers `throw new ApiError(404,"Task not found")`; `asyncHandler` forwards async errors; `middleware/errorHandler.js` turns *every* error (Zod, Mongoose, JWT, duplicates) into one JSON shape, so React handles errors in one way (`utils/format.js → getErrorMessage`).

**Validation** – Never trust the client. Zod schemas (`server/validators/schemas.js`) check types, lengths, enums and normalise (trim, lowercase email). Client-side checks are only for nicer UX.

**Password hashing** – We store `bcrypt(password)`, never the password. bcrypt is deliberately slow and adds a random *salt*, so identical passwords produce different hashes and brute force is costly. Login = hash the attempt and compare. *See* `User.js` pre-save hook, `comparePassword`, and `tests/unit/password.test.js`.

**Authentication vs authorization** – *Authentication*: who are you? (login → JWT → `protect`). *Authorization*: what may you do? (`authorize("admin")`, and ownership: `owner: req.user._id` in every query).

**JWT** – A signed token `header.payload.signature`. Payload here is `{id, iat, exp}`. The server signs with `JWT_SECRET`; anyone can read the payload, but nobody can change it without invalidating the signature. Stateless: the server needn't store sessions. *See* `server/utils/token.js`.

**Cookies (and why HTTP-only)** – The server sends `Set-Cookie`; the browser returns it with every request to that site. `HttpOnly` hides it from JavaScript (an XSS bug can't steal the token), `Secure` = HTTPS only, `SameSite=Lax` blocks it on cross-site POSTs (CSRF defence). Trade-off vs `localStorage` tokens: safer against XSS, needs `withCredentials` and CSRF awareness.

**Database schemas** – MongoDB is schemaless, Mongoose adds structure: types, `required`, `enum`, `maxlength`, defaults, indexes, hooks. *See* `server/models/Task.js`.

**Environment variables** – Config and secrets that differ per machine and must not live in code: `.env` locally, Vercel dashboard in production. Read through `process.env`. `.env.example` documents names only.

**Git workflow** – Work on a branch → commit small meaningful steps → push → open a pull request → review → merge to `main`. Vercel redeploys on each push to `main`. See Part D of the manual guide.

**Unit vs integration testing** – *Unit*: one function in isolation, no database (`tests/unit`). *Integration*: real HTTP request through Express into a real MongoDB (`tests/integration`). *Component tests* (React Testing Library) render a component and interact like a user. *Smoke/E2E*: `scripts/smoke-test.mjs` drives a running server end to end.

**Serverless deployment** – No always-on server: Vercel starts a function per request (cold start) and may reuse it (warm). Consequences: no `app.listen`, cache the DB connection on `global`, no in-memory state you depend on, keep functions few and small.

**Same-origin & the Vite proxy** – Browsers restrict cross-origin requests (CORS). If React is served at `:5173` and calls `/api`, Vite forwards to `:5000`, so the browser only sees one origin; cookies "just work". In production Vercel serves both under one domain.

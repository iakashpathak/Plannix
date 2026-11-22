# TaskFlow

TaskFlow is a project and task management application for organizing work, tracking priorities, and monitoring progress in one place. It includes a responsive React interface, an Express API, and MongoDB persistence.

## Features

- **Authentication:** Account registration and login with JWT-based sessions, secure password hashing, and protected routes.
- **Dashboard:** Project and task summaries, completion progress, upcoming due dates, overdue tasks, and recent activity.
- **Projects:** Create, update, search, filter, and delete projects, with task progress tracking.
- **Tasks:** Create, update, search, filter, sort, and paginate tasks; manage priorities, statuses, and due dates.
- **Profile:** Update account details and password.
- **Responsive interface:** Sidebar navigation on desktop and a mobile navigation drawer.

## Technology

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios
- **Backend:** Node.js 18+, Express, Zod
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, bcryptjs, HTTP-only cookies
- **Testing:** Vitest, React Testing Library, Supertest
- **Deployment:** Vercel serverless API and static frontend, with MongoDB Atlas

## Run locally

### Requirements

- Node.js 18 or newer
- npm
- MongoDB Atlas or a local MongoDB server

### Install and configure

From the project root:

```bash
npm run install:all
```

Copy the example environment file to `.env`:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux, use `cp .env.example .env`.

Edit `.env` and set at least:

```dotenv
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/taskflow?retryWrites=true&w=majority
JWT_SECRET=<a-long-random-secret>
NODE_ENV=development
```

Replace the MongoDB placeholders with the connection details from Atlas (or use your local MongoDB URI). Generate a secret for `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Keep `.env` private; do not commit it or share its contents.

### Start the application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at `http://localhost:5000`.

To check the API and database connections, open:

- `http://localhost:5000/api/health`
- `http://localhost:5000/api/health/db`

## Tests and build

```bash
npm run test:unit       # Backend unit tests; no database required
npm run test:client     # Frontend tests
npm run test:api        # Backend integration tests; requires a test database
npm run build           # Production frontend build
```

Integration tests use `MONGODB_URI_TEST` (default: `mongodb://127.0.0.1:27017/taskflow_test`). **The test setup clears its database**, so use a separate database whose name contains `test`; never point it at production data.

## Deploy to Vercel

The repository includes a Vercel configuration for serving the built frontend and routing API requests to the Express serverless function.

1. Push the project root to a GitHub repository. Confirm `.env` and `node_modules` are not included.
2. Import the repository in Vercel. Use the project root as the Root Directory and retain the settings from [`vercel.json`](vercel.json).
3. Configure MongoDB Atlas with a database user limited to the application database and a Network Access rule that permits connections from the Vercel deployment.
4. Add these environment variables in **Vercel → Project Settings → Environment Variables**:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | Atlas connection string with the `taskflow` database name |
   | `JWT_SECRET` | A strong, unique production secret; do not reuse the local value |
   | `NODE_ENV` | `production` |

5. Deploy or redeploy after setting the variables.
6. Verify `https://<your-domain>/api/health` and `https://<your-domain>/api/health/db`, then test registration, login, and task creation.

For Atlas network access details, environment options, and troubleshooting, see the [deployment guide](docs/DEPLOYMENT.md).

## Project structure

```text
api/       Vercel serverless entry point
client/    React frontend and frontend tests
server/    Express app, API routes, models, and controllers
tests/     Backend unit and integration tests
docs/      Setup, deployment, API, and troubleshooting guides
```

## Documentation

- [Local setup guide](docs/SETUP_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [API documentation](docs/API_DOCUMENTATION.md)
- [Testing guide](docs/TESTING.md)
- [Debugging guide](docs/DEBUGGING.md)
- [Architecture overview](docs/ARCHITECTURE.md)

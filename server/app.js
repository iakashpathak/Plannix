import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// The Express app is exported WITHOUT calling listen():
//  - server/dev.js   -> app.listen() for local development
//  - api/index.js    -> exported as a Vercel serverless function
//  - tests           -> handed to Supertest
const app = express();

app.set("trust proxy", 1); // Vercel sits behind a proxy; needed for req.ip, secure cookies, rate limiting
app.disable("x-powered-by");
app.use(helmet());
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// CORS is only needed when the frontend is on a different origin. Same-origin (Vite proxy / Vercel) needs none.
if (process.env.CLIENT_URL) {
  app.use(cors({ origin: process.env.CLIENT_URL.split(",").map((s) => s.trim()), credentials: true }));
}

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Health checks. /api/health never touches the DB, /api/health/db does (great for debugging deployments).
app.get("/api/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok", env: process.env.NODE_ENV || "development", time: new Date().toISOString() } })
);
app.get("/api/health/db", async (_req, res, next) => {
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    res.json({ success: true, data: { database: "connected", name: mongoose.connection.name } });
  } catch (err) {
    next(err);
  }
});

// Make sure Mongo is connected (cached across warm serverless invocations) before any data route runs.
app.use("/api", async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

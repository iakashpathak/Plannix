// Vercel serverless entry point.
// Every file inside /api becomes its own serverless function, so this folder contains
// ONLY this file. The real Express app lives in /server (MVC) and is imported here.
import app from "../server/app.js";

export default app;

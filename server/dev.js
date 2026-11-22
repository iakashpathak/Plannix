// Local development / plain Node hosting entry point. NOT used on Vercel (see /api/index.js).
import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 5000;

try {
  await connectDB();
  console.log("MongoDB connected");
} catch (err) {
  console.error("MongoDB connection failed:", err.message);
  console.error("The API will still start; /api/health works, data routes return 503 until the DB is reachable.");
}

app.listen(port, () => console.log(`TaskFlow API listening on http://localhost:${port}`));

// Usage: npm run make-admin -- someone@example.com
import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- user@example.com");
  process.exit(1);
}
await connectDB();
const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
console.log(user ? `${user.email} is now an admin` : `No user found with email ${email}`);
await disconnectDB();

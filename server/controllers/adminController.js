import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/admin/users  (admin only)
export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: { users: users.map(({ password, __v, ...u }) => u) } });
});

// GET /api/admin/stats  (admin only)
export const systemStats = asyncHandler(async (_req, res) => {
  const [users, projects, tasks] = await Promise.all([User.countDocuments(), Project.countDocuments(), Task.countDocuments()]);
  res.json({ success: true, data: { users, projects, tasks } });
});

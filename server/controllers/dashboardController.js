import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const owner = new mongoose.Types.ObjectId(String(req.user._id));
  const now = new Date();

  const [totalProjects, byStatus, overdue, recentActivities, upcoming] = await Promise.all([
    Project.countDocuments({ owner }),
    Task.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Task.countDocuments({ owner, status: { $ne: "Completed" }, dueDate: { $lt: now, $ne: null } }),
    Activity.find({ owner }).sort({ createdAt: -1 }).limit(8).lean(),
    Task.find({ owner, status: { $ne: "Completed" }, dueDate: { $ne: null } })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate({ path: "project", select: "name" })
      .lean(),
  ]);

  const count = (s) => byStatus.find((r) => r._id === s)?.count || 0;
  const pending = count("Pending");
  const inProgress = count("In Progress");
  const completed = count("Completed");
  const totalTasks = pending + inProgress + completed;

  res.json({
    success: true,
    data: {
      stats: {
        totalProjects,
        totalTasks,
        completedTasks: completed,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        overdueTasks: overdue,
        completionRate: totalTasks ? Math.round((completed / totalTasks) * 100) : 0,
      },
      recentActivities,
      upcomingTasks: upcoming,
    },
  });
});

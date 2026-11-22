import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activity.js";

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Adds { total, pending, inProgress, completed } to each project in one aggregation (no N+1 queries).
async function withTaskCounts(projects, ownerId) {
  if (projects.length === 0) return [];

  const rows = await Task.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(String(ownerId)),
        project: { $in: projects.map((project) => project._id) },
      },
    },
    { $group: { _id: { project: "$project", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const map = new Map();
  for (const r of rows) {
    const key = String(r._id.project);
    const c = map.get(key) || { total: 0, pending: 0, inProgress: 0, completed: 0 };
    c.total += r.count;
    if (r._id.status === "Pending") c.pending += r.count;
    if (r._id.status === "In Progress") c.inProgress += r.count;
    if (r._id.status === "Completed") c.completed += r.count;
    map.set(key, c);
  }
  return projects.map((p) => ({
    ...p,
    taskCounts: map.get(String(p._id)) || { total: 0, pending: 0, inProgress: 0, completed: 0 },
  }));
}

// OWNERSHIP RULE: every query includes { owner: req.user._id }. Another user's id simply "does not exist" (404).
const ownedProject = async (id, ownerId) => {
  const project = await Project.findOne({ _id: id, owner: ownerId });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

// GET /api/projects?q=&status=
export const listProjects = asyncHandler(async (req, res) => {
  const { q, status } = req.validatedQuery;
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };
  const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: { projects: await withTaskCounts(projects, req.user._id) } });
});

// GET /api/projects/:id
export const getProject = asyncHandler(async (req, res) => {
  const project = (await ownedProject(req.params.id, req.user._id)).toObject();
  const [withCounts] = await withTaskCounts([project], req.user._id);
  res.json({ success: true, data: { project: withCounts } });
});

// POST /api/projects
export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({ ...req.body, owner: req.user._id }); // owner comes from the token, NEVER from the body
  await logActivity(req.user._id, "created", "project", project.name);
  res.status(201).json({ success: true, data: { project } });
});

// PUT /api/projects/:id
export const updateProject = asyncHandler(async (req, res) => {
  const project = await ownedProject(req.params.id, req.user._id);
  project.set(req.body);
  await project.save();
  await logActivity(req.user._id, "updated", "project", project.name);
  res.json({ success: true, data: { project } });
});

// DELETE /api/projects/:id  (also removes the project's tasks)
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await ownedProject(req.params.id, req.user._id);
  const { deletedCount } = await Task.deleteMany({ project: project._id, owner: req.user._id });
  await project.deleteOne();
  await logActivity(req.user._id, "deleted", "project", project.name);
  res.json({ success: true, data: { message: "Project deleted", deletedTasks: deletedCount } });
});

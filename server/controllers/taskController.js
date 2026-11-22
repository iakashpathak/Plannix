import Project from "../models/Project.js";
import Task from "../models/Task.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activity.js";
import { escapeRegex } from "./projectController.js";

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  due: { dueDate: 1, createdAt: -1 }, // nulls sort first in Mongo ascending; handled in the UI
};

const POPULATE = { path: "project", select: "name status" };

// A task may only be attached to a project the same user owns.
async function assertOwnsProject(projectId, ownerId) {
  if (!(await Project.exists({ _id: projectId, owner: ownerId }))) throw new ApiError(400, "Project not found");
}

const ownedTask = async (id, ownerId) => {
  const task = await Task.findOne({ _id: id, owner: ownerId });
  if (!task) throw new ApiError(404, "Task not found");
  return task;
};

// GET /api/tasks?q=&status=&priority=&project=&sort=&page=&limit=
export const listTasks = asyncHandler(async (req, res) => {
  const { q, status, priority, project, sort, page, limit } = req.validatedQuery;
  const filter = { owner: req.user._id };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (project) filter.project = project;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ title: rx }, { description: rx }];
  }

  const totalPromise = Task.countDocuments(filter);
  let tasksPromise;
  if (sort === "priority") {
    // Sort High > Medium > Low using an aggregation weight, then re-hydrate with populate.
    const weight = { $switch: { branches: [{ case: { $eq: ["$priority", "High"] }, then: 0 }, { case: { $eq: ["$priority", "Medium"] }, then: 1 }], default: 2 } };
    tasksPromise = (async () => {
      const ids = await Task.aggregate([
        { $match: filter },
        { $addFields: { w: weight } },
        { $sort: { w: 1, createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { _id: 1 } },
      ]);
      const order = ids.map((d) => String(d._id));
      const docs = await Task.find({ _id: { $in: order } }).populate(POPULATE).lean();
      const positions = new Map(order.map((id, index) => [id, index]));
      return docs.sort((a, b) => positions.get(String(a._id)) - positions.get(String(b._id)));
    })();
  } else {
    tasksPromise = Task.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).populate(POPULATE).lean();
  }
  const [total, tasks] = await Promise.all([totalPromise, tasksPromise]);

  res.json({ success: true, data: { tasks, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } } });
});

// GET /api/tasks/:id
export const getTask = asyncHandler(async (req, res) => {
  const task = await ownedTask(req.params.id, req.user._id);
  await task.populate(POPULATE);
  res.json({ success: true, data: { task } });
});

// POST /api/tasks
export const createTask = asyncHandler(async (req, res) => {
  await assertOwnsProject(req.body.project, req.user._id);
  const task = await Task.create({ ...req.body, owner: req.user._id });
  await task.populate(POPULATE);
  await logActivity(req.user._id, "created", "task", task.title);
  res.status(201).json({ success: true, data: { task } });
});

// PUT /api/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  const task = await ownedTask(req.params.id, req.user._id);
  if (req.body.project) await assertOwnsProject(req.body.project, req.user._id);
  const wasCompleted = task.status === "Completed";
  task.set(req.body);
  await task.save();
  await task.populate(POPULATE);
  const justCompleted = !wasCompleted && task.status === "Completed";
  await logActivity(req.user._id, justCompleted ? "completed" : "updated", "task", task.title);
  res.json({ success: true, data: { task } });
});

// DELETE /api/tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await ownedTask(req.params.id, req.user._id);
  await task.deleteOne();
  await logActivity(req.user._id, "deleted", "task", task.title);
  res.json({ success: true, data: { message: "Task deleted" } });
});

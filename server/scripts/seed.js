// Usage: npm run seed   -> creates a demo account with sample projects/tasks (safe to re-run).
import "dotenv/config";
import { connectDB, disconnectDB } from "../config/db.js";
import Activity from "../models/Activity.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

const DEMO = { name: "Demo Student", email: "demo@plannix.dev", password: "Demo1234" };
const day = (n) => new Date(Date.now() + n * 86400000);

await connectDB();
const existing = await User.findOne({ email: DEMO.email });
if (existing) {
  await Promise.all([
    Task.deleteMany({ owner: existing._id }),
    Project.deleteMany({ owner: existing._id }),
    Activity.deleteMany({ owner: existing._id }),
  ]);
  await existing.deleteOne();
}
const user = await User.create(DEMO);
const owner = user._id;

const projects = await Project.insertMany([
  { owner, name: "Semester Project", description: "Final-year mini project submission", status: "Active" },
  { owner, name: "Placement Prep", description: "DSA practice and mock interviews", status: "Active" },
  { owner, name: "Club Website", description: "Redesign the coding club site", status: "On Hold" },
]);

const [p1, p2, p3] = projects.map((p) => p._id);
const tasks = [
  [p1, "Write project report", "Chapters 1-4", "High", "In Progress", 3],
  [p1, "Prepare demo slides", "", "Medium", "Pending", 5],
  [p1, "Set up MongoDB Atlas", "Create cluster and user", "High", "Completed", -2],
  [p2, "Solve 20 array problems", "", "Medium", "Pending", 2],
  [p2, "Mock interview with a friend", "", "Low", "Pending", -1],
  [p2, "Revise OS and DBMS notes", "", "Medium", "Completed", -4],
  [p3, "Collect design references", "", "Low", "Pending", 10],
];
for (const [project, title, description, priority, status, due] of tasks) {
  await Task.create({ owner, project, title, description, priority, status, dueDate: day(due) });
}
await Activity.create({ owner, action: "created", entityType: "project", entityName: "Semester Project" });

console.log(`Seeded demo user -> ${DEMO.email} / ${DEMO.password}`);
await disconnectDB();

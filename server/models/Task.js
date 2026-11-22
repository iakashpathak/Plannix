import mongoose from "mongoose";

export const TASK_STATUSES = ["Pending", "In Progress", "Completed"];
export const TASK_PRIORITIES = ["Low", "Medium", "High"];

const taskSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: [true, "Task title is required"], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Medium" },
    status: { type: String, enum: TASK_STATUSES, default: "Pending" },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ owner: 1, status: 1 });

// Keep completedAt in sync with status.
taskSchema.pre("save", function (next) {
  if (this.isModified("status")) this.completedAt = this.status === "Completed" ? new Date() : null;
  next();
});

export default mongoose.models.Task || mongoose.model("Task", taskSchema);

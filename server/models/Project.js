import mongoose from "mongoose";

export const PROJECT_STATUSES = ["Active", "On Hold", "Completed"];

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: [true, "Project name is required"], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: PROJECT_STATUSES, default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model("Project", projectSchema);

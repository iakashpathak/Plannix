import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["created", "updated", "completed", "deleted"], required: true },
    entityType: { type: String, enum: ["project", "task"], required: true },
    entityName: { type: String, required: true, maxlength: 120 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ owner: 1, createdAt: -1 });
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // auto-delete after 90 days

export default mongoose.models.Activity || mongoose.model("Activity", activitySchema);

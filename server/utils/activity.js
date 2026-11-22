import Activity from "../models/Activity.js";

// Fire-and-forget audit trail. A failure here must never break the main request.
export async function logActivity(owner, action, entityType, entityName) {
  try {
    await Activity.create({ owner, action, entityType, entityName });
  } catch (err) {
    if (process.env.NODE_ENV !== "test") console.error("Activity log failed:", err.message);
  }
}

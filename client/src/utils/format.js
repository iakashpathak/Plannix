// Turns any Axios/network error into a human readable message.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (error?.request && !error.response) return "Cannot reach the server. Check your connection and try again.";
  return error?.message || fallback;
}

// Converts the API's validation error list into { fieldName: "message" } for inline form errors.
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, e) => (e.field && !acc[e.field] ? { ...acc, [e.field]: e.message } : acc), {});
}

export function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// <input type="date"> wants YYYY-MM-DD.
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export function isOverdue(task, now = new Date()) {
  if (!task?.dueDate || task.status === "Completed") return false;
  const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(task.dueDate).getTime() < startOfToday;
}

export function timeAgo(value, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [name, size] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${name}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export const greeting = (hour = new Date().getHours()) => (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");

const TASK_STATUS = {
  Pending: "bg-pending-soft text-pending",
  "In Progress": "bg-progress-soft text-progress",
  Completed: "bg-done-soft text-done",
};
const PROJECT_STATUS = {
  Active: "bg-progress-soft text-progress",
  "On Hold": "bg-pending-soft text-pending",
  Completed: "bg-done-soft text-done",
};
const PRIORITY = {
  High: { dot: "bg-danger", text: "text-danger" },
  Medium: { dot: "bg-pending", text: "text-pending" },
  Low: { dot: "bg-ink-400", text: "text-ink-500" },
};

const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

export const StatusBadge = ({ status }) => <span className={`${pill} ${TASK_STATUS[status] || "bg-paper text-ink-500"}`}>{status}</span>;
export const ProjectStatusBadge = ({ status }) => <span className={`${pill} ${PROJECT_STATUS[status] || "bg-paper text-ink-500"}`}>{status}</span>;

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${p.text}`}>
      <span className={`h-2 w-2 rounded-full ${p.dot}`} aria-hidden="true" />
      {priority}
    </span>
  );
}

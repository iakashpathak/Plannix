// Simple single-colour progress bar (used on project cards).
export function ProgressBar({ value, label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-paper" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// Segmented bar showing how all tasks split across Completed / In Progress / Pending.
export function FlowBar({ completed = 0, inProgress = 0, pending = 0 }) {
  const total = completed + inProgress + pending;
  const seg = (n) => (total ? (n / total) * 100 : 0);
  const segments = [
    { value: completed, color: "bg-done" },
    { value: inProgress, color: "bg-progress" },
    { value: pending, color: "bg-pending/70" },
  ].filter(({ value }) => value > 0);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-paper" role="img" aria-label={`${completed} completed, ${inProgress} in progress, ${pending} pending`}>
        {segments.map(({ value, color }) => (
          <div key={color} className={`h-full shrink-0 ${color}`} style={{ width: `${seg(value)}%` }} />
        ))}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {[
          ["Completed", completed, "bg-done"],
          ["In progress", inProgress, "bg-progress"],
          ["Pending", pending, "bg-pending/70"],
        ].map(([label, n, color]) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-sm ${color}`} aria-hidden="true" />
            <dt className="text-ink-500">{label}</dt>
            <dd className="font-semibold">{n}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

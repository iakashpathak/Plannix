import { CalendarClock, CheckCircle2, Clock3, FolderKanban, ListChecks } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import { PriorityBadge } from "../components/Badges";
import { FlowBar, ProgressBar } from "../components/ProgressBar";
import Spinner from "../components/Spinner";
import useAuth from "../hooks/useAuth";
import { getDashboard } from "../services/dashboardService";
import { getProjects } from "../services/projectService";
import { formatDate, getErrorMessage, greeting, isOverdue, timeAgo } from "../utils/format";

function StatCard({ icon: Icon, label, value, tone = "text-brand-600 bg-brand-50" }) {
  return (
    <div className="card flex items-center gap-3 p-3 sm:gap-4 sm:p-5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xl font-bold leading-none sm:text-2xl">{value}</p>
        <p className="mt-1 text-xs leading-tight text-ink-500 sm:text-sm">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dash, projs] = await Promise.all([getDashboard(), getProjects()]);
      setData(dash);
      setProjects(projs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-ink-500">Here’s where your work stands today.</p>
      </div>

      {!loading && data && data.stats.totalTasks > 0 && (
        <section className="card relative overflow-hidden border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-4 shadow-md sm:p-5" aria-labelledby="flow-heading">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-100/60 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">Overall progress</p>
                <h2 id="flow-heading" className="text-lg font-bold">
                  Task flow
                </h2>
                <p className="text-sm text-ink-500">
                  {data.stats.completionRate}% complete
                  {data.stats.overdueTasks > 0 && <span className="font-semibold text-danger"> · {data.stats.overdueTasks} overdue</span>}
                </p>
              </div>
              <p className="shrink-0 rounded-xl bg-white/80 px-3 py-2 font-display text-3xl font-bold leading-none text-brand-700 shadow-sm">
                {data.stats.completionRate}%
              </p>
            </div>
            <FlowBar completed={data.stats.completedTasks} inProgress={data.stats.inProgressTasks} pending={data.stats.pendingTasks} />
          </div>
        </section>
      )}

      {loading && <Spinner label="Loading your dashboard" />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard icon={FolderKanban} label="Total projects" value={data.stats.totalProjects} />
            <StatCard icon={ListChecks} label="Total tasks" value={data.stats.totalTasks} tone="text-progress bg-progress-soft" />
            <StatCard icon={CheckCircle2} label="Completed tasks" value={data.stats.completedTasks} tone="text-done bg-done-soft" />
            <StatCard icon={Clock3} label="Pending tasks" value={data.stats.pendingTasks + data.stats.inProgressTasks} tone="text-pending bg-pending-soft" />
          </div>

          {data.stats.totalTasks === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No tasks yet"
              description="Create a project, then add your first task to see progress here."
              action={
                <Link to="/projects" className="btn btn-primary w-full sm:w-auto">
                  Create a project
                </Link>
              }
            />
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-4 sm:p-6" aria-labelledby="up-heading">
              <h2 id="up-heading" className="mb-4 text-lg font-bold">
                Coming up
              </h2>
              {data.upcomingTasks.length === 0 ? (
                <p className="text-sm text-ink-500">Nothing scheduled. Add due dates to your tasks to see them here.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.upcomingTasks.map((t) => (
                    <li key={t._id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{t.title}</p>
                        <p className="truncate text-xs text-ink-500">{t.project?.name}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={`flex items-center gap-1 text-xs font-semibold ${isOverdue(t) ? "text-danger" : "text-ink-500"}`}>
                          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                          {isOverdue(t) ? "Overdue · " : ""}
                          {formatDate(t.dueDate)}
                        </span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card p-4 sm:p-6" aria-labelledby="act-heading">
              <h2 id="act-heading" className="mb-4 text-lg font-bold">
                Recent activity
              </h2>
              {data.recentActivities.length === 0 ? (
                <p className="text-sm text-ink-500">Your latest changes will appear here.</p>
              ) : (
                <ul className="space-y-3">
                  {data.recentActivities.map((a) => (
                    <li key={a._id} className="flex items-start justify-between gap-3 text-sm">
                      <p>
                        You {a.action} the {a.entityType} <span className="font-semibold">{a.entityName}</span>
                      </p>
                      <time className="shrink-0 text-xs text-ink-500" dateTime={a.createdAt}>
                        {timeAgo(a.createdAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {projects.length > 0 && (
            <section className="card p-4 sm:p-6" aria-labelledby="proj-heading">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="proj-heading" className="text-lg font-bold">
                  Project progress
                </h2>
                <Link to="/projects" className="text-sm font-semibold text-brand-600 hover:underline">
                  All projects
                </Link>
              </div>
              <ul className="space-y-4">
                {projects.slice(0, 5).map((p) => {
                  const { total, completed } = p.taskCounts;
                  return (
                    <li key={p._id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <Link to={`/tasks?project=${p._id}`} className="font-semibold hover:underline">
                          {p.name}
                        </Link>
                        <span className="text-ink-500">
                          {completed}/{total} tasks
                        </span>
                      </div>
                      <ProgressBar value={total ? (completed / total) * 100 : 0} label={`${p.name} progress`} />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

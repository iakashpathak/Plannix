import { CalendarClock, ListChecks, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import TaskForm from "../components/TaskForm";
import { PriorityBadge } from "../components/Badges";
import useDebounce from "../hooks/useDebounce";
import useToast from "../hooks/useToast";
import { getProjects } from "../services/projectService";
import { createTask, deleteTask, getTasks, updateTask } from "../services/taskService";
import { TASK_PRIORITIES, TASK_STATUSES } from "../utils/constants";
import { formatDate, getErrorMessage, isOverdue } from "../utils/format";

const PAGE_SIZE = 20;
const STATUS_TONE = { Pending: "text-pending", "In Progress": "text-progress", Completed: "text-done" };

export default function Tasks() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const projectFilter = params.get("project") || "";

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const q = useDebounce(search);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  // Any filter change returns to page 1.
  useEffect(() => setPage(1), [q, status, priority, sort, projectFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTasks({
        q: q || undefined,
        status: status || undefined,
        priority: priority || undefined,
        project: projectFilter || undefined,
        sort,
        page,
        limit: PAGE_SIZE,
      });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [q, status, priority, projectFilter, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const setProjectFilter = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set("project", value);
    else next.delete("project");
    setParams(next, { replace: true });
  };

  const handleSave = async (values) => {
    if (modal.task) {
      await updateTask(modal.task._id, values);
      toast.success("Task updated");
    } else {
      await createTask(values);
      toast.success("Task created");
    }
    setModal(null);
    load();
  };

  const quickStatus = async (task, newStatus) => {
    try {
      await updateTask(task._id, { status: newStatus });
      setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t)));
      toast.success(newStatus === "Completed" ? "Nice work, task completed" : "Status updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(modal.task._id);
      toast.success("Task deleted");
      setModal(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setModal(null);
    }
  };

  const filtering = Boolean(q || status || priority || projectFilter);
  const noProjects = projects.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Tasks</h1>
          <p className="mt-1 text-ink-500">{pagination.total} task{pagination.total === 1 ? "" : "s"}{filtering ? " match your filters" : " in total"}.</p>
        </div>
        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => setModal({ type: "form" })} disabled={noProjects} title={noProjects ? "Create a project first" : undefined}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New task
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div className="relative col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input type="search" className="input pl-9" placeholder="Search tasks" aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" aria-label="Filter by project" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="input" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input" aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="input" aria-label="Sort tasks" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading && !tasks.length && <Spinner label="Loading tasks" />}

      {!loading && !error && tasks.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={filtering ? "No tasks match your filters" : noProjects ? "Create a project first" : "No tasks yet"}
          description={filtering ? "Clear a filter or try another search term." : noProjects ? "Every task belongs to a project. Create one, then come back to add tasks." : "Add your first task and set a priority and due date."}
          action={
            !filtering &&
            (noProjects ? (
              <Link to="/projects" className="btn btn-primary w-full sm:w-auto">
                Go to projects
              </Link>
            ) : (
              <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => setModal({ type: "form" })}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Create task
              </button>
            ))
          }
        />
      )}

      {tasks.length > 0 && (
        <div className={`card overflow-hidden ${loading ? "opacity-60" : ""}`}>
          <div className="hidden grid-cols-[minmax(0,3fr)_minmax(0,1.5fr)_7rem_9.5rem_9rem_5.5rem] gap-4 border-b border-line bg-paper px-5 py-3 text-xs font-semibold text-ink-500 md:grid">
            <span>Task</span>
            <span>Project</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="divide-y divide-line">
            {tasks.map((t) => (
              <li key={t._id} className="grid gap-x-4 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1.5fr)_7rem_9.5rem_9rem_5.5rem] md:items-center">
                <div className="min-w-0">
                  <p className={`font-semibold ${t.status === "Completed" ? "text-ink-400 line-through" : ""}`}>{t.title}</p>
                  {t.description && <p className="truncate text-sm text-ink-500">{t.description}</p>}
                </div>
                <p className="truncate text-sm text-ink-500">{t.project?.name}</p>
                <PriorityBadge priority={t.priority} />
                <select
                  aria-label={`Status of ${t.title}`}
                  value={t.status}
                  onChange={(e) => quickStatus(t, e.target.value)}
                  className={`w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-semibold ${STATUS_TONE[t.status]}`}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <p className={`flex items-center gap-1.5 text-sm ${isOverdue(t) ? "font-semibold text-danger" : "text-ink-500"}`}>
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {isOverdue(t) ? "Overdue · " : ""}
                  {formatDate(t.dueDate)}
                </p>
                <div className="-mr-2 flex md:justify-end">
                  <button type="button" className="icon-btn" aria-label={`Edit ${t.title}`} onClick={() => setModal({ type: "form", task: t })}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" className="icon-btn hover:text-danger" aria-label={`Delete ${t.title}`} onClick={() => setModal({ type: "delete", task: t })}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pagination.pages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Pagination">
          <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-sm text-ink-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button type="button" className="btn btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </nav>
      )}

      {modal?.type === "form" && (
        <Modal title={modal.task ? "Edit task" : "New task"} onClose={() => setModal(null)}>
          <TaskForm initial={modal.task} projects={projects} defaultProject={projectFilter} onSubmit={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog title="Delete task?" message={`“${modal.task.title}” will be permanently deleted.`} confirmLabel="Delete task" onConfirm={handleDelete} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

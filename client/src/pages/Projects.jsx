import { FolderKanban, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";
import Modal from "../components/Modal";
import ProjectForm from "../components/ProjectForm";
import { ProjectStatusBadge } from "../components/Badges";
import { ProgressBar } from "../components/ProgressBar";
import Spinner from "../components/Spinner";
import useDebounce from "../hooks/useDebounce";
import useToast from "../hooks/useToast";
import { createProject, deleteProject, getProjects, updateProject } from "../services/projectService";
import { PROJECT_STATUSES } from "../utils/constants";
import { getErrorMessage } from "../utils/format";

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(null); // { type: "form", project? } | { type: "delete", project }
  const q = useDebounce(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProjects(await getProjects({ q: q || undefined, status: status || undefined }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (values) => {
    if (modal.project) {
      await updateProject(modal.project._id, values);
      toast.success("Project updated");
    } else {
      await createProject(values);
      toast.success("Project created");
    }
    setModal(null);
    load();
  };

  const handleDelete = async () => {
    try {
      const { deletedTasks } = await deleteProject(modal.project._id);
      toast.success(`Project deleted${deletedTasks ? ` along with ${deletedTasks} task${deletedTasks > 1 ? "s" : ""}` : ""}`);
      setModal(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setModal(null);
    }
  };

  const filtering = Boolean(q || status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Projects</h1>
          <p className="mt-1 text-ink-500">Group related tasks and track how far along each one is.</p>
        </div>
        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => setModal({ type: "form" })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New project
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input type="search" className="input pl-9" placeholder="Search projects" aria-label="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading && !projects.length && <Spinner label="Loading projects" />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={filtering ? "No projects match your filters" : "No projects yet"}
          description={filtering ? "Try a different search term or status." : "Projects keep your tasks organised. Create your first one to get started."}
          action={
            !filtering && (
              <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => setModal({ type: "form" })}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Create project
              </button>
            )
          }
        />
      )}

      {projects.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const { total, completed } = p.taskCounts;
            return (
              <li key={p._id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold leading-snug">{p.name}</h2>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-500">{p.description || "No description."}</p>
                <div className="mt-5">
                  <div className="mb-1.5 flex justify-between text-xs text-ink-500">
                    <span>
                      {completed} of {total} task{total === 1 ? "" : "s"} done
                    </span>
                    <span>{total ? Math.round((completed / total) * 100) : 0}%</span>
                  </div>
                  <ProgressBar value={total ? (completed / total) * 100 : 0} label={`${p.name} progress`} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <Link to={`/tasks?project=${p._id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                    View tasks
                  </Link>
                  <div className="-mr-2 flex">
                    <button type="button" className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => setModal({ type: "form", project: p })}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" className="icon-btn hover:text-danger" aria-label={`Delete ${p.name}`} onClick={() => setModal({ type: "delete", project: p })}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal?.type === "form" && (
        <Modal title={modal.project ? "Edit project" : "New project"} onClose={() => setModal(null)}>
          <ProjectForm initial={modal.project} onSubmit={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Delete project?"
          message={`“${modal.project.name}” and all ${modal.project.taskCounts.total} of its tasks will be permanently deleted. This can’t be undone.`}
          confirmLabel="Delete project"
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

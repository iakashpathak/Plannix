import { useState } from "react";
import { TASK_PRIORITIES, TASK_STATUSES } from "../utils/constants";
import { getErrorMessage, getFieldErrors, toDateInput } from "../utils/format";
import ErrorMessage from "./ErrorMessage";
import FormField from "./FormField";

export default function TaskForm({ initial, projects, defaultProject = "", onSubmit, onCancel }) {
  const [values, setValues] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    project: initial?.project?._id || initial?.project || defaultProject || "",
    priority: initial?.priority || "Medium",
    status: initial?.status || "Pending",
    dueDate: toDateInput(initial?.dueDate),
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.title.trim()) next.title = "Task title is required";
    if (!values.project) next.project = "Choose a project";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError("");
    try {
      await onSubmit({ ...values, title: values.title.trim(), description: values.description.trim(), dueDate: values.dueDate || null });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={serverError} />
      <FormField label="Title" value={values.title} onChange={set("title")} error={errors.title} maxLength={120} placeholder="What needs to be done?" />
      <FormField label="Description" as="textarea" rows={3} value={values.description} onChange={set("description")} error={errors.description} maxLength={1000} />
      <FormField label="Project" error={errors.project}>
        {(p) => (
          <select {...p} value={values.project} onChange={set("project")}>
            <option value="">Select a project…</option>
            {projects.map((pr) => (
              <option key={pr._id} value={pr._id}>
                {pr.name}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Priority">
          {(p) => (
            <select {...p} value={values.priority} onChange={set("priority")}>
              {TASK_PRIORITIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Status">
          {(p) => (
            <select {...p} value={values.status} onChange={set("status")}>
              {TASK_STATUSES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          )}
        </FormField>
      </div>
      <FormField label="Due date" type="date" value={values.dueDate} onChange={set("dueDate")} error={errors.dueDate} />
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}

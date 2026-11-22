import { useState } from "react";
import { PROJECT_STATUSES } from "../utils/constants";
import { getErrorMessage, getFieldErrors } from "../utils/format";
import ErrorMessage from "./ErrorMessage";
import FormField from "./FormField";

export default function ProjectForm({ initial, onSubmit, onCancel }) {
  const [values, setValues] = useState({ name: initial?.name || "", description: initial?.description || "", status: initial?.status || "Active" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = "Project name is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError("");
    try {
      await onSubmit({ ...values, name: values.name.trim(), description: values.description.trim() });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorMessage message={serverError} />
      <FormField label="Project name" value={values.name} onChange={set("name")} error={errors.name} maxLength={100} placeholder="e.g. Semester project" />
      <FormField label="Description" as="textarea" rows={3} value={values.description} onChange={set("description")} error={errors.description} maxLength={500} placeholder="What is this project about?" />
      <FormField label="Status">
        {(p) => (
          <select {...p} value={values.status} onChange={set("status")}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        )}
      </FormField>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Create project"}
        </button>
      </div>
    </form>
  );
}

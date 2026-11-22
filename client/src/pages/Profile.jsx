import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import { changePassword, updateProfile } from "../services/userService";
import { getErrorMessage, getFieldErrors } from "../utils/format";

function ProfileForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [values, setValues] = useState({ name: user.name, email: user.email });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (values.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = "Enter a valid email address";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      setUser(await updateProfile({ name: values.name.trim(), email: values.email.trim() }));
      toast.success("Profile updated");
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <ErrorMessage message={serverError} />
      <FormField label="Full name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} error={errors.name} />
      <FormField label="Email" type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} error={errors.email} />
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: "", newPassword: "", confirm: "" };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.currentPassword) next.currentPassword = "Enter your current password";
    if (values.newPassword.length < 8) next.newPassword = "Password must be at least 8 characters";
    else if (!/[A-Za-z]/.test(values.newPassword) || !/\d/.test(values.newPassword)) next.newPassword = "Use at least one letter and one number";
    if (values.confirm !== values.newPassword) next.confirm = "Passwords do not match";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      setValues(empty);
      toast.success("Password changed");
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <ErrorMessage message={serverError} />
      <FormField label="Current password" type="password" autoComplete="current-password" value={values.currentPassword} onChange={set("currentPassword")} error={errors.currentPassword} />
      <FormField label="New password" type="password" autoComplete="new-password" value={values.newPassword} onChange={set("newPassword")} error={errors.newPassword} hint="At least 8 characters, with a letter and a number." />
      <FormField label="Confirm new password" type="password" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Profile</h1>
          <p className="mt-1 text-ink-500">Manage your account details and password.</p>
        </div>
        <button type="button" className="btn btn-secondary w-full sm:w-auto" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
        </button>
      </div>

      <section className="card flex items-center gap-4 p-5" aria-label="Account summary">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 font-display text-2xl font-bold text-white" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{user.name}</p>
          <p className="truncate text-sm text-ink-500">{user.email}</p>
          <p className="text-xs text-ink-500">
            {user.role === "admin" ? "Administrator" : "Member"} since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="pf">
          <h2 id="pf" className="mb-4 text-lg font-bold">
            Personal details
          </h2>
          <ProfileForm />
        </section>
        <section className="card p-6" aria-labelledby="pw">
          <h2 id="pw" className="mb-4 text-lg font-bold">
            Change password
          </h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}

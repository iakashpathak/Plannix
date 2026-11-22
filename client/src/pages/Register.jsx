import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import useAuth from "../hooks/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import { getErrorMessage, getFieldErrors } from "../utils/format";

export function validateRegister(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Name must be at least 2 characters";
  if (!v.email.trim()) e.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Enter a valid email address";
  if (v.password.length < 8) e.password = "Password must be at least 8 characters";
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) e.password = "Use at least one letter and one number";
  if (v.confirm !== v.password) e.confirm = "Passwords do not match";
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validateRegister(values);
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free to use. Start organising in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorMessage message={serverError} />
        <FormField label="Full name" autoComplete="name" value={values.name} onChange={set("name")} error={errors.name} />
        <FormField label="Email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} />
        <FormField label="Password" type="password" autoComplete="new-password" value={values.password} onChange={set("password")} error={errors.password} hint="At least 8 characters, with a letter and a number." />
        <FormField label="Confirm password" type="password" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
        <button type="submit" className="btn btn-primary w-full py-2.5" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}

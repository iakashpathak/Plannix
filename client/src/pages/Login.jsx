import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import FormField from "../components/FormField";
import useAuth from "../hooks/useAuth";
import AuthLayout from "../layouts/AuthLayout";
import { getErrorMessage, getFieldErrors } from "../utils/format";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = "Enter a valid email address";
    if (!values.password) next.password = "Password is required";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your projects and tasks."
      mobileBrandHeader
      footer={
        <>
          New to Plannix?{" "}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorMessage message={serverError} />
        <FormField label="Email" type="email" autoComplete="email" value={values.email} onChange={set("email")} error={errors.email} />
        <FormField label="Password" type="password" autoComplete="current-password" value={values.password} onChange={set("password")} error={errors.password} />
        <button type="submit" className="btn btn-primary w-full py-2.5" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}

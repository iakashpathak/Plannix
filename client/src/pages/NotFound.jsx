import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-2xl font-bold">This page doesn’t exist</h1>
      <p className="mt-2 text-ink-500">The link may be broken, or the page may have moved.</p>
      <Link to="/dashboard" className="btn btn-primary mt-6">
        Go to dashboard
      </Link>
    </div>
  );
}

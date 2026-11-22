export default function Spinner({ label = "Loading", className = "" }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 py-16 text-ink-500 ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand-600" aria-hidden="true" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

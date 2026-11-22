import { useId } from "react";

// Label + control + inline error, wired together for screen readers.
export default function FormField({ label, error, hint, children, as = "input", ...props }) {
  const id = useId();
  const Control = as;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children ? (
        children({ id, "aria-invalid": !!error, "aria-describedby": describedBy, className: `input ${error ? "input-error" : ""}` })
      ) : (
        <Control id={id} aria-invalid={!!error} aria-describedby={describedBy} className={`input ${error ? "input-error" : ""}`} {...props} />
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

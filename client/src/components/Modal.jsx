import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export default function Modal({ title, onClose, children, size = "md" }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog (first form control, else the panel itself).
    const first = panelRef.current?.querySelector("input, select, textarea, button:not([data-close])");
    (first || panelRef.current)?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-pop sm:rounded-2xl ${size === "sm" ? "sm:max-w-md" : "sm:max-w-lg"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" data-close onClick={onClose} className="icon-btn -mr-2" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

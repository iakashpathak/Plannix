import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useCallback, useMemo, useRef, useState } from "react";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const push = useCallback((type, message) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ success: (m) => push("success", m), error: (m) => push("error", m) }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,22rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="pointer-events-auto flex items-start gap-3 rounded-xl bg-ink-900 px-4 py-3 text-sm text-white shadow-pop">
            {t.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

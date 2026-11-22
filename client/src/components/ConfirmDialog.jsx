import { useState } from "react";
import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <p className="text-sm text-ink-700">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={handle} disabled={busy}>
          {busy ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

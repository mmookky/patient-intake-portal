"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useEffect, useId, useRef } from "react";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  tone?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Go back",
  pending = false,
  tone = "primary",
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelButton.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onCancel, open, pending]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700 focus-visible:outline-red-600"
      : "bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600";
  const iconClass =
    tone === "danger"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <span
          className={`grid size-11 place-items-center rounded-xl ${iconClass}`}
        >
          <AlertTriangle className="size-5" />
        </span>
        <h2 id={titleId} className="mt-5 text-xl font-semibold text-slate-950">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 leading-6 text-slate-600">
          {description}
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButton}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

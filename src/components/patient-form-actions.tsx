import { ChevronRight, LoaderCircle, RotateCcw } from "lucide-react";

export function PatientFormActions({
  isSaving,
  isSubmitting,
  isOffline,
  onReset,
}: {
  isSaving: boolean;
  isSubmitting: boolean;
  isOffline: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">
        {isSaving ? "Saving your draft…" : "Draft saved automatically"}
      </span>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onReset}
          disabled={isSubmitting || isSaving}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="size-4" /> Reset form
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isOffline}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <>
              Review and submit <ChevronRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import { CheckCircle2, ChevronRight, Clipboard } from "lucide-react";
import { Brand } from "@/components/brand";

export function SubmissionSuccess({
  copied,
  onCopyStaffLink,
  onStartNewForm,
}: {
  copied: boolean;
  onCopyStaffLink: () => void;
  onStartNewForm: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Brand />
      <main className="mx-auto grid max-w-xl place-items-center px-4 py-20 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-10" />
        </span>
        <h1 className="mt-7 text-3xl font-semibold text-slate-950">
          Information submitted
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          Thank you. The care team has received your information and can review
          the completed submission.
        </p>
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onStartNewForm}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700"
          >
            Start a new form <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={onCopyStaffLink}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Clipboard className="size-4" />
            {copied ? "Link copied" : "Copy staff view link"}
          </button>
        </div>
      </main>
    </div>
  );
}

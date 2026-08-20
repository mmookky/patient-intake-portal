import { Clipboard } from "lucide-react";
import { ConnectionBadge } from "@/components/connection-badge";
import type { ConnectionStatus } from "@/lib/patient-schema";

export function PatientFormHeader({
  connectionStatus,
  copied,
  onCopyStaffLink,
}: {
  connectionStatus: ConnectionStatus;
  copied: boolean;
  onCopyStaffLink: () => void;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold tracking-wide text-blue-700 uppercase">
          Patient registration
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Tell us about yourself
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Complete the form below so our care team can prepare for your visit.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 self-start">
        <ConnectionBadge status={connectionStatus} />
        <button
          type="button"
          onClick={onCopyStaffLink}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Clipboard className="size-4" />
          {copied ? "Link copied" : "Copy staff link"}
        </button>
      </div>
    </div>
  );
}

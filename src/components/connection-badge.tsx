import { ConnectionIndicator } from "@/components/connection-indicator";
import type { ConnectionStatus } from "@/lib/patient-schema";

export function ConnectionBadge({
  status,
  elevated = false,
}: {
  status: ConnectionStatus;
  elevated?: boolean;
}) {
  return (
    <span
      className={`rounded-full border border-slate-200 bg-white px-3 py-2 ${elevated ? "shadow-sm" : ""}`}
    >
      <ConnectionIndicator status={status} />
    </span>
  );
}

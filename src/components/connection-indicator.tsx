import { Cloud, CloudOff, LoaderCircle } from "lucide-react";
import type { ConnectionStatus } from "@/lib/patient-schema";

const labels: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Live connection",
  reconnecting: "Reconnecting",
  offline: "Connection lost",
};

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const Icon =
    status === "connected"
      ? Cloud
      : status === "offline"
        ? CloudOff
        : LoaderCircle;
  return (
    <span
      className={`inline-flex items-center gap-2 text-sm ${status === "connected" ? "text-emerald-700" : "text-amber-700"}`}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={`size-4 ${status === "connecting" || status === "reconnecting" ? "animate-spin" : ""}`}
      />
      {labels[status]}
    </span>
  );
}

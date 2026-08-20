"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ConnectionStatus, PatientStatus } from "@/lib/patient-schema";
import { staffFeedChannelName } from "@/lib/session-store";

export interface StaffSessionSignal {
  sessionId: string;
  status: PatientStatus;
}

function isSessionSignal(value: unknown): value is StaffSessionSignal {
  if (!value || typeof value !== "object") return false;
  const signal = value as Partial<StaffSessionSignal>;
  return (
    typeof signal.sessionId === "string" &&
    (signal.status === "active" ||
      signal.status === "inactive" ||
      signal.status === "submitted")
  );
}

export function useStaffSessionFeed(
  onSession: (session: StaffSessionSignal) => void,
) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const onSessionRef = useRef(onSession);

  useEffect(() => {
    onSessionRef.current = onSession;
  }, [onSession]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      const channel = new BroadcastChannel(staffFeedChannelName);
      channel.onmessage = (event: MessageEvent<StaffSessionSignal>) => {
        if (isSessionSignal(event.data)) onSessionRef.current(event.data);
      };
      queueMicrotask(() => setConnectionStatus("connected"));
      return () => channel.close();
    }

    const emitPresences = (presences: unknown[]) => {
      for (const presence of presences) {
        if (isSessionSignal(presence)) onSessionRef.current(presence);
      }
    };

    const channel = supabase
      .channel(staffFeedChannelName, {
        config: { presence: { key: `staff-${crypto.randomUUID()}` } },
      })
      .on("broadcast", { event: "session-opened" }, ({ payload }) => {
        if (isSessionSignal(payload)) onSessionRef.current(payload);
      })
      .on("presence", { event: "sync" }, () => {
        emitPresences(Object.values(channel.presenceState()).flat());
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        emitPresences(newPresences);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnectionStatus("connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setConnectionStatus("reconnecting");
        else if (status === "CLOSED") setConnectionStatus("offline");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return connectionStatus;
}

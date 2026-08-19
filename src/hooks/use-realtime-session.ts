"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ConnectionStatus, PatientSession, SessionMessage } from "@/lib/patient-schema";

interface RealtimeSessionOptions {
  sessionId: string;
  role: "patient" | "staff";
  onSession: (session: PatientSession) => void;
}

export function useRealtimeSession({ sessionId, role, onSession }: RealtimeSessionOptions) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const supabaseChannel = useRef<RealtimeChannel | null>(null);
  const browserChannel = useRef<BroadcastChannel | null>(null);
  const onSessionRef = useRef(onSession);

  useEffect(() => {
    onSessionRef.current = onSession;
  }, [onSession]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      const channel = new BroadcastChannel(`agnos-session:${sessionId}`);
      browserChannel.current = channel;
      channel.onmessage = (event: MessageEvent<SessionMessage>) => onSessionRef.current(event.data.session);
      queueMicrotask(() => setConnectionStatus("connected"));
      return () => channel.close();
    }

    const channel = supabase
      .channel(`patient-session:${sessionId}`, { config: { presence: { key: `${role}-${crypto.randomUUID()}` } } })
      .on("broadcast", { event: "session-update" }, ({ payload }) => {
        onSessionRef.current((payload as SessionMessage).session);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
          await channel.track({ role, onlineAt: new Date().toISOString() });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("reconnecting");
        } else if (status === "CLOSED") {
          setConnectionStatus("offline");
        }
      });

    supabaseChannel.current = channel;
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [role, sessionId]);

  const broadcast = useCallback(async (session: PatientSession) => {
    const message: SessionMessage = { type: "snapshot", session };
    if (supabaseChannel.current) {
      await supabaseChannel.current.send({ type: "broadcast", event: "session-update", payload: message });
    } else {
      browserChannel.current?.postMessage(message);
    }
  }, []);

  return { connectionStatus, broadcast };
}

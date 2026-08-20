"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  ConnectionStatus,
  PatientSession,
  SessionMessage,
} from "@/lib/patient-schema";
import { staffFeedChannelName } from "@/lib/session-store";

interface RealtimeSessionOptions {
  sessionId: string;
  role: "patient" | "staff";
  onSession: (session: PatientSession) => void;
  onPatientLeave?: () => void;
}

export function useRealtimeSession({
  sessionId,
  role,
  onSession,
  onPatientLeave,
}: RealtimeSessionOptions) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const supabaseChannel = useRef<RealtimeChannel | null>(null);
  const staffFeedChannel = useRef<RealtimeChannel | null>(null);
  const pendingStaffSignal = useRef<PatientSession | null>(null);
  const browserChannel = useRef<BroadcastChannel | null>(null);
  const onSessionRef = useRef(onSession);
  const onPatientLeaveRef = useRef(onPatientLeave);

  useEffect(() => {
    onSessionRef.current = onSession;
    onPatientLeaveRef.current = onPatientLeave;
  }, [onPatientLeave, onSession]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      const channel = new BroadcastChannel(
        `patient-intake-session:${sessionId}`,
      );
      browserChannel.current = channel;
      channel.onmessage = (event: MessageEvent<SessionMessage>) =>
        onSessionRef.current(event.data.session);
      queueMicrotask(() => setConnectionStatus("connected"));
      return () => channel.close();
    }

    const channel = supabase
      .channel(`patient-session:${sessionId}`, {
        config: { presence: { key: `${role}-${crypto.randomUUID()}` } },
      })
      .on("broadcast", { event: "session-update" }, ({ payload }) => {
        onSessionRef.current((payload as SessionMessage).session);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        if (leftPresences.some((presence) => presence.role === "patient")) {
          onPatientLeaveRef.current?.();
        }
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
    const feedChannel =
      role === "patient"
        ? supabase
            .channel(staffFeedChannelName, {
              config: { presence: { key: `patient-${sessionId}` } },
            })
            .subscribe(async (status) => {
              if (status === "SUBSCRIBED" && pendingStaffSignal.current) {
                const pending = pendingStaffSignal.current;
                await staffFeedChannel.current?.track({
                  sessionId: pending.id,
                  status: pending.status,
                });
              }
            })
        : null;
    staffFeedChannel.current = feedChannel;

    return () => {
      void supabase.removeChannel(channel);
      if (feedChannel) void supabase.removeChannel(feedChannel);
    };
  }, [role, sessionId]);

  const broadcast = useCallback(async (session: PatientSession) => {
    const message: SessionMessage = { type: "snapshot", session };
    const staffSignal = { sessionId: session.id, status: session.status };
    if (supabaseChannel.current) {
      await supabaseChannel.current.send({
        type: "broadcast",
        event: "session-update",
        payload: message,
      });
      pendingStaffSignal.current = session;
      if (staffFeedChannel.current) {
        await staffFeedChannel.current.send({
          type: "broadcast",
          event: "session-opened",
          payload: staffSignal,
        });
        await staffFeedChannel.current.track(staffSignal);
      }
    } else {
      browserChannel.current?.postMessage(message);
      const channel = new BroadcastChannel(staffFeedChannelName);
      channel.postMessage(staffSignal);
      channel.close();
    }
  }, []);

  return { connectionStatus, broadcast };
}

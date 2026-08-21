"use client";

import { Bell, ExternalLink, Radio, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ConnectionBadge } from "@/components/connection-badge";
import {
  useStaffSessionFeed,
  type StaffSessionSignal,
} from "@/hooks/use-staff-session-feed";
import type { ConnectionStatus, PatientSession } from "@/lib/patient-schema";

const StaffConnectionContext = createContext<ConnectionStatus>("connecting");

export function StaffConnectionStatus() {
  const status = useContext(StaffConnectionContext);
  return <ConnectionBadge status={status} elevated />;
}

interface SessionNotice {
  id: string;
  status: PatientSession["status"];
}

export function StaffSessionMonitor({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const pathnameRef = useRef(pathname);
  const seenSessionIds = useRef(new Set<string>());
  const toastTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [notices, setNotices] = useState<SessionNotice[]>([]);
  const [visibleToastIds, setVisibleToastIds] = useState<string[]>([]);
  const [isListOpen, setIsListOpen] = useState(false);

  useEffect(() => {
    pathnameRef.current = pathname;
    const detailMatch = pathname.match(/^\/staff\/([^/]+)$/);
    if (detailMatch) seenSessionIds.current.add(detailMatch[1]);
  }, [pathname]);

  useEffect(
    () => () => {
      for (const timer of toastTimers.current.values()) clearTimeout(timer);
    },
    [],
  );

  const receiveSession = useCallback(
    (session: StaffSessionSignal) => {
      const currentPath = pathnameRef.current;
      const currentId = currentPath.match(/^\/staff\/([^/]+)$/)?.[1];
      if (
        currentId === session.sessionId ||
        seenSessionIds.current.has(session.sessionId)
      )
        return;

      seenSessionIds.current.add(session.sessionId);
      if (currentPath === "/staff") {
        router.replace(`/staff/${session.sessionId}`);
        return;
      }

      setNotices((current) => [
        ...current.filter((notice) => notice.id !== session.sessionId),
        { id: session.sessionId, status: session.status },
      ]);
      setVisibleToastIds((current) => [
        ...current.filter((id) => id !== session.sessionId),
        session.sessionId,
      ]);
      const existingTimer = toastTimers.current.get(session.sessionId);
      if (existingTimer) clearTimeout(existingTimer);
      toastTimers.current.set(
        session.sessionId,
        setTimeout(() => {
          setVisibleToastIds((current) =>
            current.filter((id) => id !== session.sessionId),
          );
          toastTimers.current.delete(session.sessionId);
        }, 10_000),
      );
    },
    [router],
  );

  const connectionStatus = useStaffSessionFeed(receiveSession);

  function dismissNotice(id: string) {
    setNotices((current) => current.filter((notice) => notice.id !== id));
    hideToast(id);
  }

  function hideToast(id: string) {
    setVisibleToastIds((current) =>
      current.filter((toastId) => toastId !== id),
    );
    const timer = toastTimers.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.current.delete(id);
  }

  const visibleToasts = notices.filter((notice) =>
    visibleToastIds.includes(notice.id),
  );

  return (
    <StaffConnectionContext.Provider value={connectionStatus}>
      {children}

      {!isListOpen && visibleToasts.length > 0 && (
        <div
          className="fixed right-4 bottom-20 z-50 flex w-[calc(100%-2rem)] max-w-[17rem] flex-col gap-2 sm:right-6"
          aria-live="polite"
        >
          {visibleToasts.slice(-3).map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              compact
              onDismiss={hideToast}
            />
          ))}
        </div>
      )}

      {isListOpen && notices.length > 0 && (
        <section className="fixed right-4 bottom-20 z-50 w-[calc(100%-2rem)] max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 sm:right-6">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
            <p className="flex items-baseline gap-1.5 text-sm font-semibold text-slate-950">
              New sessions
              <span className="text-[11px] font-normal text-slate-500">
                {notices.length} unread
              </span>
            </p>
            <button
              type="button"
              onClick={() => setIsListOpen(false)}
              className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close notification list"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {notices.map((notice) => (
              <NoticeListItem
                key={notice.id}
                notice={notice}
                onDismiss={dismissNotice}
              />
            ))}
          </div>
        </section>
      )}

      {notices.length > 0 && (
        <button
          type="button"
          onClick={() => setIsListOpen((open) => !open)}
          className="fixed right-4 bottom-4 z-50 grid size-12 place-items-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-300 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:right-6 sm:bottom-6"
          aria-label={`${notices.length} new patient ${notices.length === 1 ? "session" : "sessions"}`}
          aria-expanded={isListOpen}
        >
          <Bell className="size-5" />
          <span className="absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] leading-none font-bold text-white">
            {notices.length > 99 ? "99+" : notices.length}
          </span>
        </button>
      )}
    </StaffConnectionContext.Provider>
  );
}

function NoticeListItem({
  notice,
  onDismiss,
}: {
  notice: SessionNotice;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
        <Radio className="size-3" />
      </span>
      <a
        href={`/staff/${notice.id}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onDismiss(notice.id)}
        className="min-w-0 flex-1 rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600"
        aria-label={`Open patient session ${notice.id.slice(0, 8)} in a new tab`}
      >
        <span className="block truncate text-xs font-semibold text-slate-900">
          Patient {notice.id.slice(0, 8)}…
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
          {notice.status} · Open in new tab
          <ExternalLink className="size-2.5" />
        </span>
      </a>
      <button
        type="button"
        onClick={() => onDismiss(notice.id)}
        className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        aria-label={`Remove session ${notice.id.slice(0, 8)} notification`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function NoticeCard({
  notice,
  compact = false,
  onDismiss,
}: {
  notice: SessionNotice;
  compact?: boolean;
  onDismiss: (id: string) => void;
}) {
  return (
    <article
      className={`rounded-xl border border-blue-200 bg-white ${compact ? "p-2.5 shadow-lg shadow-slate-300/40" : "p-3"}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700">
          <Radio className="size-3" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-950">
            New patient session
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-600">
            Session {notice.id.slice(0, 8)}… is {notice.status}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(notice.id)}
          className="grid size-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          aria-label={`Remove session ${notice.id.slice(0, 8)} notification`}
        >
          <X className="size-3.5" />
        </button>
      </div>
      <a
        href={`/staff/${notice.id}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onDismiss(notice.id)}
        className="mt-2 inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-700"
      >
        View in new tab <ExternalLink className="size-3" />
      </a>
    </article>
  );
}

"use client";

import {
  Activity,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Radio,
  UserRound,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { ConnectionIndicator } from "@/components/connection-indicator";
import { useRealtimeSession } from "@/hooks/use-realtime-session";
import type { PatientSession, PatientStatus } from "@/lib/patient-schema";
import { markSessionInactive } from "@/lib/session-lifecycle";
import { loadSession } from "@/lib/session-store";

const statusStyle: Record<
  PatientStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  active: {
    label: "Actively filling",
    className: "bg-emerald-100 text-emerald-800",
    icon: <Radio className="size-4" />,
  },
  inactive: {
    label: "Inactive",
    className: "bg-amber-100 text-amber-800",
    icon: <Clock3 className="size-4" />,
  },
  submitted: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-800",
    icon: <CheckCircle2 className="size-4" />,
  },
};

export function StaffView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<PatientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const receiveSession = useCallback(
    (incoming: PatientSession) => setSession(incoming),
    [],
  );
  const handlePatientLeave = useCallback(() => {
    setSession((current) => (current ? markSessionInactive(current) : current));
  }, []);
  const { connectionStatus } = useRealtimeSession({
    sessionId,
    role: "staff",
    onSession: receiveSession,
    onPatientLeave: handlePatientLeave,
  });

  useEffect(() => {
    void loadSession(sessionId)
      .then(setSession)
      .catch(() =>
        setLoadError(
          "We couldn't load this patient session. Check the connection and try again.",
        ),
      )
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading)
    return (
      <CenteredState
        icon={<LoaderCircle className="size-7 animate-spin" />}
        title="Loading patient session"
        description="Retrieving the latest saved information…"
      />
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <Brand />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {loadError ? (
          <CenteredCard
            icon={<WifiOff />}
            title="Unable to load session"
            description={loadError}
          />
        ) : !session ? (
          <EmptySession />
        ) : (
          <SessionDetails
            session={session}
            connectionStatus={connectionStatus}
          />
        )}
      </main>
    </div>
  );
}

function SessionDetails({
  session,
  connectionStatus,
}: {
  session: PatientSession;
  connectionStatus: Parameters<typeof ConnectionIndicator>[0]["status"];
}) {
  const { formData } = session;
  const fullName =
    [formData.firstName, formData.middleName, formData.lastName]
      .filter(Boolean)
      .join(" ") || "Patient session";
  const status = statusStyle[session.status];
  const updatedLabel = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(session.updatedAt));

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-700 uppercase">
            Live patient intake
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {fullName}
          </h1>
          <p className="mt-2 text-sm break-all text-slate-500">
            Session {session.id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ${status.className}`}
          >
            {status.icon}
            {status.label}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2">
            <ConnectionIndicator status={connectionStatus} />
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 size-5 text-blue-600" />
          <div>
            <p className="font-medium text-slate-900">Last update</p>
            <p className="mt-1 text-sm text-slate-500">{updatedLabel}</p>
          </div>
        </div>
      </div>

      {session.status === "submitted" && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Submission complete</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              This is the patient&apos;s confirmed information and is no longer
              receiving live edits.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <DetailSection
            title="Personal information"
            items={[
              ["First name", formData.firstName],
              ["Middle name", formData.middleName],
              ["Last name", formData.lastName],
              ["Date of birth", formatDate(formData.dateOfBirth)],
              ["Gender", formData.gender],
            ]}
          />
          <DetailSection
            title="Contact details"
            items={[
              ["Phone number", formData.phoneNumber],
              ["Email", formData.email],
              ["Address", formData.address],
            ]}
          />
          <DetailSection
            title="Preferences"
            items={[
              ["Preferred language", formData.preferredLanguage],
              ["Nationality", formData.nationality],
              ["Religion", formData.religion],
            ]}
          />
          <DetailSection
            title="Emergency contact"
            items={[
              ["Contact name", formData.emergencyContactName],
              ["Relationship", formData.emergencyContactRelationship],
            ]}
          />
        </div>
        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <h2 className="font-semibold text-slate-950">Session activity</h2>
          <div className="mt-5 space-y-5 border-l border-slate-200 pl-5">
            <ActivityItem
              label={
                session.status === "submitted"
                  ? "Form submitted"
                  : session.status === "active"
                    ? "Patient is editing"
                    : "Patient is inactive"
              }
              time={updatedLabel}
              active
            />
            <ActivityItem
              label="Session started"
              time={new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(session.createdAt))}
            />
          </div>
          <p className="mt-6 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            Status changes to inactive after 30 seconds without patient
            interaction.
          </p>
        </aside>
      </div>
    </>
  );
}

function DetailSection({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-950 sm:px-6">
        {title}
      </h2>
      <dl className="grid sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="border-b border-slate-100 px-5 py-4 last:border-b-0 sm:px-6 sm:nth-last-[-n+2]:border-b-0"
          >
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              {label}
            </dt>
            <dd
              className={`mt-1.5 break-words ${value ? "font-medium text-slate-900" : "text-slate-400 italic"}`}
            >
              {value || "Not provided yet"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ActivityItem({
  label,
  time,
  active,
}: {
  label: string;
  time: string;
  active?: boolean;
}) {
  return (
    <div className="relative">
      <span
        className={`absolute top-1.5 -left-[25px] size-2 rounded-full ${active ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-300"}`}
      />
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{time}</p>
    </div>
  );
}

function EmptySession() {
  return (
    <CenteredCard
      icon={<UserRound />}
      title="Waiting for patient activity"
      description="No saved information exists for this session yet. The view will update when the patient opens the matching intake form."
    />
  );
}

function CenteredCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-700">
        {icon}
      </span>
      <h1 className="mt-6 text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
      {action && <div className="mt-7">{action}</div>}
    </section>
  );
}

function CenteredState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="text-center text-blue-600">
        {icon}
        <h1 className="mt-4 font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

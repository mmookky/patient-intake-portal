"use client";

import {
  Activity,
  ArrowRight,
  ClipboardPlus,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createDemoSessionId, getDemoSessionId } from "@/lib/demo-session";

export function RoleSelector() {
  const router = useRouter();

  function startPatientSession() {
    router.push(`/patient/${createDemoSessionId()}`);
  }

  function openStaffSession() {
    router.push(`/staff/${getDemoSessionId()}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-100/80 to-transparent"
      />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-slate-900">
            <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <HeartPulse aria-hidden="true" className="size-6" />
            </span>
            Patient Intake Portal
          </div>
          <span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <Activity aria-hidden="true" className="size-4 text-emerald-600" />{" "}
            Real-time care coordination
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 sm:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold tracking-wide text-blue-700 uppercase">
              Secure patient intake
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance text-slate-950 sm:text-5xl">
              Patient information, connected in real time
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Choose how you would like to continue. Patient entries appear
              instantly for the care team.
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-5 md:grid-cols-2">
            <RoleCard
              icon={<ClipboardPlus className="size-7" />}
              title="I'm a patient"
              description="Share your personal and contact information with the care team through a guided form."
              action="Start patient form"
              onClick={startPatientSession}
              primary
            />
            <RoleCard
              icon={<Stethoscope className="size-7" />}
              title="I'm a staff member"
              description="Monitor the demo patient session, review live updates, and see when the form is submitted."
              action="Open staff view"
              onClick={openStaffSession}
            />
          </div>
          <p className="mt-7 text-center text-sm text-slate-500">
            Demo environment — do not enter real patient information.
          </p>
        </section>
      </div>
    </main>
  );
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  primary?: boolean;
}

function RoleCard({
  icon,
  title,
  description,
  action,
  onClick,
  primary,
}: RoleCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/60 sm:p-8">
      <span
        className={`mb-7 grid size-14 place-items-center rounded-2xl ${primary ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}
      >
        {icon}
      </span>
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 min-h-14 leading-7 text-slate-600">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className={`mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${primary ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-300 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50"}`}
      >
        {action} <ArrowRight aria-hidden="true" className="size-4" />
      </button>
    </article>
  );
}

import { Radio, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { StaffConnectionStatus } from "@/components/staff-session-monitor";

export default function StaffDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Brand />
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <div className="mb-3 flex justify-end">
            <StaffConnectionStatus />
          </div>
          <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <Radio className="size-7 animate-pulse" />
            </span>
            <p className="mt-6 text-sm font-semibold tracking-wide text-blue-700 uppercase">
              Staff session monitor
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Waiting for patient activity
            </h1>
            <p className="mt-4 leading-7 text-slate-600">
              This view will open the first patient session automatically as
              soon as a patient enters the intake form.
            </p>
            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-left">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <p className="text-sm leading-6 text-slate-600">
                Additional sessions appear as notifications and never replace
                the patient record you are currently reviewing.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

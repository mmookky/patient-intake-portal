import Link from "next/link";
import { HeartPulse, ShieldCheck } from "lucide-react";

export function Brand() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold text-slate-900"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
            <HeartPulse aria-hidden="true" className="size-5" />
          </span>
          <span>Patient Intake Portal</span>
        </Link>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck aria-hidden="true" className="size-4 text-emerald-600" />
          Privacy-aware demo
        </span>
      </div>
    </header>
  );
}

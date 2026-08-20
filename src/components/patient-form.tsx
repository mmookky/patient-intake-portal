"use client";

/* eslint-disable react-hooks/refs -- React Hook Form invokes the submit callback only from an event. */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChevronRight,
  Clipboard,
  HeartHandshake,
  Languages,
  LoaderCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Brand } from "@/components/brand";
import { ConnectionIndicator } from "@/components/connection-indicator";
import { FormField } from "@/components/form-field";
import { useRealtimeSession } from "@/hooks/use-realtime-session";
import {
  createEmptySession,
  emptyPatientForm,
  patientFormSchema,
  type PatientFormData,
  type PatientSession,
} from "@/lib/patient-schema";
import {
  markSessionInactive,
  submitSession,
  updateActiveSession,
} from "@/lib/session-lifecycle";
import { loadSession, saveSession } from "@/lib/session-store";

const INACTIVITY_MS = 30_000;
const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

export function PatientForm({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<PatientSession>(() =>
    createEmptySession(sessionId),
  );
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);
  const sessionRef = useRef(session);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: emptyPatientForm,
    mode: "onBlur",
  });
  const formValues = useWatch({ control });

  const receiveSession = useCallback(
    (incoming: PatientSession) => {
      if (incoming.status === "submitted") {
        sessionRef.current = incoming;
        setSession(incoming);
        reset(incoming.formData);
      }
    },
    [reset],
  );

  const { connectionStatus, broadcast } = useRealtimeSession({
    sessionId,
    role: "patient",
    onSession: receiveSession,
  });

  const publish = useCallback(
    (next: PatientSession, persist = false) => {
      sessionRef.current = next;
      setSession(next);
      void broadcast(next);
      if (persist) {
        setIsSaving(true);
        void saveSession(next).finally(() => setIsSaving(false));
      }
    },
    [broadcast],
  );

  const scheduleInactive = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (sessionRef.current.status === "submitted") return;
      const inactive = markSessionInactive(sessionRef.current);
      publish(inactive, true);
    }, INACTIVITY_MS);
  }, [publish]);

  useEffect(() => {
    void loadSession(sessionId)
      .then((stored) => {
        const initial = stored ?? createEmptySession(sessionId);
        sessionRef.current = initial;
        setSession(initial);
        reset(initial.formData);
        if (!stored) void saveSession(initial);
        if (initial.status !== "submitted") scheduleInactive();
      })
      .finally(() => setIsReady(true));

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [reset, scheduleInactive, sessionId]);

  useEffect(() => {
    if (!isReady || sessionRef.current.status === "submitted") return;
    const next = updateActiveSession(sessionRef.current, {
      ...emptyPatientForm,
      ...formValues,
    } as PatientFormData);
    publish(next);
    scheduleInactive();
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => publish(next, true), 1_000);
  }, [formValues, isReady, publish, scheduleInactive]);

  useEffect(() => {
    const markInactiveOnExit = () => {
      if (sessionRef.current.status !== "submitted") {
        void broadcast(markSessionInactive(sessionRef.current));
      }
    };
    window.addEventListener("pagehide", markInactiveOnExit);
    return () => window.removeEventListener("pagehide", markInactiveOnExit);
  }, [broadcast]);

  async function submitForm(data: PatientFormData) {
    setSubmitError("");
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    const submitted = submitSession(sessionRef.current, data);
    try {
      await saveSession(submitted);
      await broadcast(submitted);
      sessionRef.current = submitted;
      setSession(submitted);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(
        "We couldn't submit the form. Your information is still here—please try again.",
      );
      scheduleInactive();
    }
  }

  async function copyStaffLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/staff/${sessionId}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  }

  if (!isReady) return <LoadingScreen />;

  if (session.status === "submitted") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Brand />
        <main className="mx-auto grid max-w-xl place-items-center px-4 py-20 text-center">
          <span className="grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="size-10" />
          </span>
          <h1 className="mt-7 text-3xl font-semibold text-slate-950">
            Information submitted
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Thank you. The care team has received your information and can
            review the completed submission.
          </p>
          <button
            type="button"
            onClick={copyStaffLink}
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Clipboard className="size-4" />{" "}
            {copied ? "Link copied" : "Copy staff view link"}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Brand />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-700 uppercase">
              Patient registration
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Tell us about yourself
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Complete the form below so our care team can prepare for your
              visit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2">
              <ConnectionIndicator status={connectionStatus} />
            </span>
            <button
              type="button"
              onClick={copyStaffLink}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Clipboard className="size-4" />
              {copied ? "Link copied" : "Copy staff link"}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(submitForm)}
          noValidate
          className="space-y-5"
        >
          <FormSection
            icon={<UserRound className="size-5" />}
            title="Personal information"
            description="Your identity and basic details"
          >
            <FormField
              id="firstName"
              label="First name"
              required
              error={errors.firstName?.message}
            >
              <input
                id="firstName"
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                aria-describedby={
                  errors.firstName ? "firstName-error" : undefined
                }
                className={inputClass}
                {...register("firstName")}
              />
            </FormField>
            <FormField
              id="middleName"
              label="Middle name"
              error={errors.middleName?.message}
            >
              <input
                id="middleName"
                autoComplete="additional-name"
                className={inputClass}
                {...register("middleName")}
              />
            </FormField>
            <FormField
              id="lastName"
              label="Last name"
              required
              error={errors.lastName?.message}
            >
              <input
                id="lastName"
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                className={inputClass}
                {...register("lastName")}
              />
            </FormField>
            <FormField
              id="dateOfBirth"
              label="Date of birth"
              required
              error={errors.dateOfBirth?.message}
            >
              <input
                id="dateOfBirth"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className={inputClass}
                {...register("dateOfBirth")}
              />
            </FormField>
            <FormField
              id="gender"
              label="Gender"
              required
              error={errors.gender?.message}
            >
              <select
                id="gender"
                className={inputClass}
                {...register("gender")}
              >
                <option value="">Select gender</option>
                <option>Female</option>
                <option>Male</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
                <option>Other</option>
              </select>
            </FormField>
          </FormSection>

          <FormSection
            icon={<Phone className="size-5" />}
            title="Contact details"
            description="How the care team can reach you"
          >
            <FormField
              id="phoneNumber"
              label="Phone number"
              required
              error={errors.phoneNumber?.message}
            >
              <input
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                placeholder="+66 81 234 5678"
                className={inputClass}
                {...register("phoneNumber")}
              />
            </FormField>
            <FormField
              id="email"
              label="Email"
              required
              error={errors.email?.message}
            >
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className={inputClass}
                {...register("email")}
              />
            </FormField>
            <FormField
              id="address"
              label="Address"
              required
              error={errors.address?.message}
              className="md:col-span-2"
            >
              <textarea
                id="address"
                rows={3}
                autoComplete="street-address"
                className={`${inputClass} resize-y py-3`}
                {...register("address")}
              />
            </FormField>
          </FormSection>

          <FormSection
            icon={<Languages className="size-5" />}
            title="Preferences"
            description="Help us communicate with you comfortably"
          >
            <FormField
              id="preferredLanguage"
              label="Preferred language"
              required
              error={errors.preferredLanguage?.message}
            >
              <select
                id="preferredLanguage"
                className={inputClass}
                {...register("preferredLanguage")}
              >
                <option value="">Select language</option>
                <option>Thai</option>
                <option>English</option>
                <option>Chinese</option>
                <option>Japanese</option>
                <option>Other</option>
              </select>
            </FormField>
            <FormField
              id="nationality"
              label="Nationality"
              required
              error={errors.nationality?.message}
            >
              <input
                id="nationality"
                autoComplete="country-name"
                className={inputClass}
                {...register("nationality")}
              />
            </FormField>
            <FormField
              id="religion"
              label="Religion (optional)"
              error={errors.religion?.message}
              className="md:col-span-2"
            >
              <input
                id="religion"
                className={inputClass}
                {...register("religion")}
              />
            </FormField>
          </FormSection>

          <FormSection
            icon={<HeartHandshake className="size-5" />}
            title="Emergency contact"
            description="Optional—complete both fields if you add a contact"
          >
            <FormField
              id="emergencyContactName"
              label="Contact name"
              error={errors.emergencyContactName?.message}
            >
              <input
                id="emergencyContactName"
                className={inputClass}
                {...register("emergencyContactName")}
              />
            </FormField>
            <FormField
              id="emergencyContactRelationship"
              label="Relationship"
              error={errors.emergencyContactRelationship?.message}
            >
              <input
                id="emergencyContactRelationship"
                className={inputClass}
                {...register("emergencyContactRelationship")}
              />
            </FormField>
          </FormSection>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {submitError}
            </div>
          )}
          <div className="flex flex-col-reverse items-stretch justify-between gap-4 pt-2 sm:flex-row sm:items-center">
            <span className="text-sm text-slate-500">
              {isSaving ? "Saving your draft…" : "Draft saved automatically"}
            </span>
            <button
              type="submit"
              disabled={isSubmitting || connectionStatus === "offline"}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <>
                  Review and submit <ChevronRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50">
      <div className="text-center text-slate-600">
        <LoaderCircle className="mx-auto mb-3 size-7 animate-spin text-blue-600" />
        Preparing your secure form…
      </div>
    </main>
  );
}

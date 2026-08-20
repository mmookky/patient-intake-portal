"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  HeartHandshake,
  Languages,
  LoaderCircle,
  Phone,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Brand } from "@/components/brand";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { FormField } from "@/components/form-field";
import { PageState } from "@/components/page-state";
import { PatientFormActions } from "@/components/patient-form-actions";
import { PatientFormHeader } from "@/components/patient-form-header";
import { PatientFormSection } from "@/components/patient-form-section";
import { SubmissionSuccess } from "@/components/submission-success";
import { useCopyFeedback } from "@/hooks/use-copy-feedback";
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
  resetSessionDraft,
  submitSession,
  updateActiveSession,
} from "@/lib/session-lifecycle";
import { loadSession, saveSession } from "@/lib/session-store";
import { createDemoSessionId } from "@/lib/demo-session";

const INACTIVITY_MS = 10_000;
const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100";

export function PatientForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<PatientSession>(() =>
    createEmptySession(sessionId),
  );
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pendingSubmission, setPendingSubmission] =
    useState<PatientFormData | null>(null);
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
  const sessionRef = useRef(session);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDraftSave = useRef<Promise<void> | null>(null);
  const submissionInProgress = useRef(false);
  const { copied, copy } = useCopyFeedback();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
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
      if (
        next.status !== "submitted" &&
        (submissionInProgress.current ||
          sessionRef.current.status === "submitted")
      )
        return;

      sessionRef.current = next;
      setSession(next);
      void broadcast(next);
      if (persist) {
        setIsSaving(true);
        const save = saveSession(next);
        pendingDraftSave.current = save;
        void save.finally(() => {
          if (pendingDraftSave.current === save) {
            pendingDraftSave.current = null;
            setIsSaving(false);
          }
        });
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
        void broadcast(initial);
        if (initial.status !== "submitted") scheduleInactive();
      })
      .finally(() => setIsReady(true));

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [broadcast, reset, scheduleInactive, sessionId]);

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
    if (!isReady) return;

    const markActiveFromInteraction = () => {
      if (document.hidden || sessionRef.current.status === "submitted") return;

      if (sessionRef.current.status !== "active") {
        const active = updateActiveSession(
          sessionRef.current,
          sessionRef.current.formData,
        );
        publish(active, true);
      }
      scheduleInactive();
    };

    const markInactiveWhileAway = () => {
      if (sessionRef.current.status === "submitted") return;
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const inactive = markSessionInactive(sessionRef.current);
      publish(inactive, true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) markInactiveWhileAway();
      else markActiveFromInteraction();
    };

    document.addEventListener("pointermove", markActiveFromInteraction, {
      passive: true,
    });
    document.addEventListener("pointerdown", markActiveFromInteraction, {
      passive: true,
    });
    document.addEventListener("keydown", markActiveFromInteraction);
    document.addEventListener("scroll", markActiveFromInteraction, {
      passive: true,
    });
    document.addEventListener("touchstart", markActiveFromInteraction, {
      passive: true,
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", markActiveFromInteraction);
    window.addEventListener("blur", markInactiveWhileAway);
    window.addEventListener("pagehide", markInactiveWhileAway);

    if (document.hidden) markInactiveWhileAway();

    return () => {
      document.removeEventListener("pointermove", markActiveFromInteraction);
      document.removeEventListener("pointerdown", markActiveFromInteraction);
      document.removeEventListener("keydown", markActiveFromInteraction);
      document.removeEventListener("scroll", markActiveFromInteraction);
      document.removeEventListener("touchstart", markActiveFromInteraction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", markActiveFromInteraction);
      window.removeEventListener("blur", markInactiveWhileAway);
      window.removeEventListener("pagehide", markInactiveWhileAway);
    };
  }, [isReady, publish, scheduleInactive]);

  useEffect(() => {
    if (
      navigator.webdriver ||
      !isReady ||
      !isDirty ||
      session.status === "submitted"
    )
      return;

    const confirmTabClose = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", confirmTabClose);
    return () => window.removeEventListener("beforeunload", confirmTabClose);
  }, [isDirty, isReady, session.status]);

  async function submitForm(data: PatientFormData): Promise<boolean> {
    setSubmitError("");
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    submissionInProgress.current = true;
    const submitted = submitSession(sessionRef.current, data);
    try {
      await pendingDraftSave.current;
      await saveSession(submitted);
      await broadcast(submitted);
      sessionRef.current = submitted;
      setSession(submitted);
      submissionInProgress.current = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    } catch {
      submissionInProgress.current = false;
      setSubmitError(
        "We couldn't submit the form. Your information is still here—please try again.",
      );
      scheduleInactive();
      return false;
    }
  }

  async function confirmSubmission() {
    if (!pendingSubmission) return;
    setIsFinalSubmitting(true);
    const succeeded = await submitForm(pendingSubmission);
    setIsFinalSubmitting(false);
    if (succeeded) setPendingSubmission(null);
  }

  async function copyStaffLink() {
    await copy(`${window.location.origin}/staff/${sessionId}`);
  }

  function startNewForm() {
    router.push(`/patient/${createDemoSessionId()}`);
  }

  function resetDraft() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSubmitError("");
    const cleared = resetSessionDraft(sessionRef.current);
    reset({ ...emptyPatientForm });
    publish(cleared, true);
    scheduleInactive();
    setIsResetConfirmationOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isReady)
    return (
      <PageState
        icon={
          <LoaderCircle className="mx-auto mb-3 size-7 animate-spin text-blue-600" />
        }
        title="Preparing your secure form"
        description="Loading the latest patient session…"
        tone="slate"
      />
    );

  if (session.status === "submitted") {
    return (
      <SubmissionSuccess
        copied={copied}
        onCopyStaffLink={() => void copyStaffLink()}
        onStartNewForm={startNewForm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Brand />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <PatientFormHeader
          connectionStatus={connectionStatus}
          copied={copied}
          onCopyStaffLink={() => void copyStaffLink()}
        />

        <form
          onSubmit={handleSubmit((data) => setPendingSubmission(data))}
          noValidate
          className="space-y-5"
        >
          <PatientFormSection
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
          </PatientFormSection>

          <PatientFormSection
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
          </PatientFormSection>

          <PatientFormSection
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
          </PatientFormSection>

          <PatientFormSection
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
          </PatientFormSection>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {submitError}
            </div>
          )}
          <PatientFormActions
            isSaving={isSaving}
            isSubmitting={isSubmitting || isFinalSubmitting}
            isOffline={connectionStatus === "offline"}
            onReset={() => setIsResetConfirmationOpen(true)}
          />
        </form>
      </main>
      <ConfirmationDialog
        open={pendingSubmission !== null}
        title="Submit patient information?"
        description="Please confirm that the information is correct. You cannot edit this form after it has been submitted."
        confirmLabel="Confirm submission"
        pending={isFinalSubmitting}
        onCancel={() => setPendingSubmission(null)}
        onConfirm={() => void confirmSubmission()}
      />
      <ConfirmationDialog
        open={isResetConfirmationOpen}
        title="Reset this form?"
        description="Every field in this draft will be cleared. This action cannot be undone."
        confirmLabel="Reset form"
        tone="danger"
        onCancel={() => setIsResetConfirmationOpen(false)}
        onConfirm={resetDraft}
      />
    </div>
  );
}

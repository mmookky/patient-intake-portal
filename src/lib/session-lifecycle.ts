import type { PatientFormData, PatientSession } from "./patient-schema";

export function updateActiveSession(
  session: PatientSession,
  formData: PatientFormData,
  now = new Date(),
): PatientSession {
  if (session.status === "submitted") return session;
  return {
    ...session,
    formData,
    status: "active",
    updatedAt: now.toISOString(),
  };
}

export function markSessionInactive(
  session: PatientSession,
  now = new Date(),
): PatientSession {
  if (session.status === "submitted") return session;
  return { ...session, status: "inactive", updatedAt: now.toISOString() };
}

export function submitSession(
  session: PatientSession,
  formData: PatientFormData,
  now = new Date(),
): PatientSession {
  const timestamp = now.toISOString();
  return {
    ...session,
    formData,
    status: "submitted",
    updatedAt: timestamp,
    submittedAt: timestamp,
  };
}

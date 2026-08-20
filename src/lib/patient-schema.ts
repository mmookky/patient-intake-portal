import { z } from "zod";

const PERSON_NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const TEXT_VALUE_PATTERN = /[\p{L}\p{N}]/u;
const GENDERS = [
  "Female",
  "Male",
  "Non-binary",
  "Prefer not to say",
  "Other",
] as const;
const LANGUAGES = ["Thai", "English", "Chinese", "Japanese", "Other"] as const;

function isValidBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isNotFutureDate(value: string) {
  return new Date(`${value}T00:00:00`) <= new Date();
}

function isWithinMaximumAge(value: string) {
  const minimum = new Date();
  minimum.setFullYear(minimum.getFullYear() - 120);
  return new Date(`${value}T00:00:00`) >= minimum;
}

const requiredName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(80, `${label} must be 80 characters or fewer`)
    .regex(PERSON_NAME_PATTERN, "Letters only");

const optionalName = (label: string, maximum = 80) =>
  z
    .string()
    .trim()
    .max(maximum, `${label} must be ${maximum} characters or fewer`)
    .refine(
      (value) => !value || PERSON_NAME_PATTERN.test(value),
      "Letters only",
    );

export const patientFormSchema = z
  .object({
    firstName: requiredName("First name"),
    middleName: optionalName("Middle name"),
    lastName: requiredName("Last name"),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(
        (value) => !value || isValidBirthDate(value),
        "Enter a valid date of birth",
      )
      .refine(
        (value) => !value || !isValidBirthDate(value) || isNotFutureDate(value),
        "Date of birth cannot be in the future",
      )
      .refine(
        (value) =>
          !value || !isValidBirthDate(value) || isWithinMaximumAge(value),
        "Date of birth must be within the last 120 years",
      ),
    gender: z
      .string()
      .min(1, "Gender is required")
      .refine(
        (value) => (GENDERS as readonly string[]).includes(value),
        "Select a valid gender",
      ),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .regex(/^\+?[0-9][0-9\s().-]*$/, "Enter a valid phone number")
      .refine((value) => {
        const digitCount = value.replace(/\D/g, "").length;
        return digitCount >= 8 && digitCount <= 15;
      }, "Phone number must contain 8 to 15 digits"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(254, "Email address is too long")
      .email("Enter a valid email address"),
    address: z
      .string()
      .trim()
      .min(5, "Enter a complete address")
      .max(300, "Address must be 300 characters or fewer")
      .regex(TEXT_VALUE_PATTERN, "Address must contain letters or numbers"),
    preferredLanguage: z
      .string()
      .min(1, "Preferred language is required")
      .refine(
        (value) => (LANGUAGES as readonly string[]).includes(value),
        "Select a valid preferred language",
      ),
    nationality: requiredName("Nationality"),
    emergencyContactName: optionalName("Emergency contact name"),
    emergencyContactRelationship: optionalName(
      "Emergency contact relationship",
      60,
    ),
    religion: optionalName("Religion", 80),
  })
  .superRefine((data, context) => {
    const hasName = Boolean(data.emergencyContactName);
    const hasRelationship = Boolean(data.emergencyContactRelationship);

    if (hasName !== hasRelationship) {
      const path = hasName
        ? "emergencyContactRelationship"
        : "emergencyContactName";
      context.addIssue({
        code: "custom",
        path: [path],
        message: "Complete both emergency contact fields",
      });
    }
  });

export type PatientFormData = z.infer<typeof patientFormSchema>;
export type PatientStatus = "active" | "inactive" | "submitted";
export type ConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "offline";

export interface PatientSession {
  id: string;
  formData: PatientFormData;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface SessionMessage {
  type: "snapshot";
  session: PatientSession;
}

export const emptyPatientForm: PatientFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phoneNumber: "",
  email: "",
  address: "",
  preferredLanguage: "",
  nationality: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  religion: "",
};

export function createEmptySession(id: string): PatientSession {
  const now = new Date().toISOString();
  return {
    id,
    formData: emptyPatientForm,
    status: "active",
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
  };
}

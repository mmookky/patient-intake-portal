import { z } from "zod";

const optionalText = z.string().trim().max(120).or(z.literal(""));

export const patientFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    middleName: optionalText,
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((value) => new Date(`${value}T00:00:00`) <= new Date(), "Date of birth cannot be in the future"),
    gender: z.string().min(1, "Gender is required"),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .regex(/^\+?[0-9][0-9\s()-]{7,19}$/, "Enter a valid phone number"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
    address: z.string().trim().min(1, "Address is required").max(300),
    preferredLanguage: z.string().min(1, "Preferred language is required"),
    nationality: z.string().trim().min(1, "Nationality is required").max(80),
    emergencyContactName: optionalText,
    emergencyContactRelationship: optionalText,
    religion: optionalText,
  })
  .superRefine((data, context) => {
    const hasName = Boolean(data.emergencyContactName);
    const hasRelationship = Boolean(data.emergencyContactRelationship);

    if (hasName !== hasRelationship) {
      const path = hasName ? "emergencyContactRelationship" : "emergencyContactName";
      context.addIssue({
        code: "custom",
        path: [path],
        message: "Complete both emergency contact fields",
      });
    }
  });

export type PatientFormData = z.infer<typeof patientFormSchema>;
export type PatientStatus = "active" | "inactive" | "submitted";
export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline";

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

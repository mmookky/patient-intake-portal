import { describe, expect, it } from "vitest";
import { patientFormSchema, type PatientFormData } from "./patient-schema";

const validForm: PatientFormData = {
  firstName: "Narin",
  middleName: "",
  lastName: "Sukjai",
  dateOfBirth: "1993-05-14",
  gender: "Male",
  phoneNumber: "+66 81 234 5678",
  email: "narin@example.com",
  address: "Bangkok, Thailand",
  preferredLanguage: "Thai",
  nationality: "Thai",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  religion: "",
};

describe("patientFormSchema", () => {
  it("accepts a complete form with optional fields empty", () => {
    expect(patientFormSchema.safeParse(validForm).success).toBe(true);
  });

  it("rejects invalid email, phone number, and future birth dates", () => {
    const result = patientFormSchema.safeParse({
      ...validForm,
      email: "invalid",
      phoneNumber: "12",
      dateOfBirth: "2999-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["email", "phoneNumber", "dateOfBirth"]),
      );
  });

  it("requires both emergency contact fields when either is entered", () => {
    const result = patientFormSchema.safeParse({
      ...validForm,
      emergencyContactName: "Mali",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path).toEqual([
        "emergencyContactRelationship",
      ]);
  });

  it("accepts Thai and international names with common separators", () => {
    const result = patientFormSchema.safeParse({
      ...validForm,
      firstName: "ปุณณภา",
      middleName: "Anne-Marie",
      lastName: "O’Connor",
      nationality: "Thai",
      emergencyContactName: "สมหญิง ใจดี",
      emergencyContactRelationship: "Mother-in-law",
    });

    expect(result.success).toBe(true);
  });

  it("rejects numbers and symbols in name fields", () => {
    const result = patientFormSchema.safeParse({
      ...validForm,
      firstName: "Narin123",
      lastName: "Sukjai@",
      nationality: "Thai2",
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["firstName", "lastName", "nationality"]),
      );
  });

  it("rejects unsupported select values and implausible field values", () => {
    const result = patientFormSchema.safeParse({
      ...validForm,
      dateOfBirth: "1800-02-31",
      gender: "Unknown",
      phoneNumber: "+66 12",
      address: "---",
      preferredLanguage: "Unsupported",
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "dateOfBirth",
          "gender",
          "phoneNumber",
          "address",
          "preferredLanguage",
        ]),
      );
  });
});

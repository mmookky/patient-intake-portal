import { describe, expect, it } from "vitest";
import { createEmptySession, emptyPatientForm } from "./patient-schema";
import {
  markSessionInactive,
  resetSessionDraft,
  submitSession,
  updateActiveSession,
} from "./session-lifecycle";

const now = new Date("2026-08-19T10:00:00.000Z");

describe("patient session lifecycle", () => {
  it("returns an inactive session after inactivity", () => {
    expect(markSessionInactive(createEmptySession("demo"), now).status).toBe(
      "inactive",
    );
  });

  it("returns to active when the patient edits again", () => {
    const inactive = markSessionInactive(createEmptySession("demo"), now);
    expect(updateActiveSession(inactive, emptyPatientForm, now).status).toBe(
      "active",
    );
  });

  it("keeps submitted as the terminal status", () => {
    const submitted = submitSession(
      createEmptySession("demo"),
      emptyPatientForm,
      now,
    );
    expect(
      markSessionInactive(submitted, new Date("2026-08-19T11:00:00.000Z")),
    ).toBe(submitted);
    expect(
      updateActiveSession(
        submitted,
        emptyPatientForm,
        new Date("2026-08-19T11:00:00.000Z"),
      ),
    ).toBe(submitted);
  });

  it("clears an editable draft without changing its identity", () => {
    const session = updateActiveSession(
      createEmptySession("demo"),
      { ...emptyPatientForm, firstName: "Narin" },
      now,
    );
    const reset = resetSessionDraft(
      session,
      new Date("2026-08-19T10:04:00.000Z"),
    );

    expect(reset.id).toBe(session.id);
    expect(reset.createdAt).toBe(session.createdAt);
    expect(reset.formData).toEqual(emptyPatientForm);
    expect(reset.status).toBe("active");
    expect(reset.updatedAt).toBe("2026-08-19T10:04:00.000Z");
  });
});

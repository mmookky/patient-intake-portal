import { expect, test } from "@playwright/test";

test("landing page exposes both portal interfaces", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /patient information/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /start patient form/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /open staff view/i }),
  ).toBeVisible();
});

test("patient form reports validation errors", async ({ page }) => {
  await page.goto("/patient/e2e-validation");
  await page.getByRole("button", { name: /review and submit/i }).click();
  await expect(page.getByText("First name is required")).toBeVisible();
  await expect(page.getByText("Email is required")).toBeVisible();
});

test("patient confirms before submitting valid information", async ({
  page,
}) => {
  await page.goto("/patient/e2e-confirmation");
  await page.getByLabel("First name").fill("Narin");
  await page.getByLabel("Last name").fill("Sukjai");
  await page.getByLabel("Date of birth").fill("1993-05-14");
  await page.getByLabel("Gender").selectOption("Male");
  await page.getByLabel("Phone number").fill("+66 81 234 5678");
  await page.getByLabel("Email").fill("narin@example.com");
  await page.getByLabel("Address").fill("Bangkok, Thailand");
  await page.getByLabel("Preferred language").selectOption("Thai");
  await page.getByLabel("Nationality").fill("Thai");

  await page.getByRole("button", { name: /review and submit/i }).click();

  const confirmation = page.getByRole("alertdialog", {
    name: /submit patient information/i,
  });
  await expect(confirmation).toBeVisible();
  await expect(
    confirmation.getByText(/cannot edit this form after/i),
  ).toBeVisible();
  await confirmation.getByRole("button", { name: /go back/i }).click();
  await expect(confirmation).toBeHidden();

  await page.getByRole("button", { name: /^reset form$/i }).click();
  const resetConfirmation = page.getByRole("alertdialog", {
    name: /reset this form/i,
  });
  await expect(resetConfirmation).toBeVisible();
  await resetConfirmation
    .getByRole("button", { name: /^reset form$/i })
    .click();
  await expect(page.getByLabel("First name")).toHaveValue("");
});

test("staff monitor waits without creating a patient session", async ({
  page,
}) => {
  await page.goto("/staff");
  await expect(
    page.getByRole("heading", { name: /waiting for patient activity/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /start new session/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /open patient form/i }),
  ).toHaveCount(0);
});

test("responsive pages have no horizontal overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const landingOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(landingOverflow).toBe(false);
  await page.screenshot({
    path: `test-results/landing-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await page.goto(`/patient/visual-${testInfo.project.name}`);
  await page.getByLabel("First name").fill("Narin");
  await page.getByLabel("Last name").fill("Sukjai");
  await page.waitForTimeout(1_200);
  const patientOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(patientOverflow).toBe(false);
  await page.screenshot({
    path: `test-results/patient-${testInfo.project.name}.png`,
    fullPage: true,
  });

  await page.goto(`/staff/visual-${testInfo.project.name}`);
  await expect(
    page.getByRole("heading", { name: "Narin Sukjai" }),
  ).toBeVisible();
  const staffOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(staffOverflow).toBe(false);
  await page.screenshot({
    path: `test-results/staff-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

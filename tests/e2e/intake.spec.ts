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

test("staff view offers the matching patient session", async ({ page }) => {
  await page.goto("/staff/e2e-session");
  await expect(
    page.getByRole("heading", { name: /waiting for patient activity/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open patient form/i }),
  ).toHaveAttribute("href", "/patient/e2e-session");
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

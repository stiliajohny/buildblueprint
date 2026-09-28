import { test, expect } from "@playwright/test";

test("sign in, sign up, and password reset screens", async ({ page }) => {
  await page.goto("/auth");
  if (
    await page
      .getByText("Account storage needs Supabase configuration")
      .isVisible()
  ) {
    await expect(
      page.getByRole("link", { name: "Continue without an account" }),
    ).toBeVisible();
    return;
  }
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Forgot password?" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Phone code" })).toHaveCount(0);
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(
    page.getByRole("heading", { name: "Create account" }),
  ).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
  await page.goto("/auth?mode=forgot");
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveCount(0);
  await page.goto("/auth?error=callback");
  await expect(page.getByRole("alert")).toContainText("expired");
  await page.goto("/auth/update-password");
  await expect(
    page.getByRole("heading", { name: "Choose a new password" }),
  ).toBeVisible();
});

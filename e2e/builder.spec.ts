import { test, expect, type Page } from "@playwright/test";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";
async function step(page: Page, label: string) {
  if (
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .getByRole("button", { name: new RegExp("^" + label) })
    .first()
    .click();
}
test("complete selection, review and archive journey", async ({ page }) => {
  await page.goto("/builder");
  await expect(
    page.getByRole("heading", { name: "Frontend & clients", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Select Expo", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Select React Native", exact: true }),
  ).toBeChecked();
  await step(page, "Backend & database");
  await expect(
    page.getByRole("checkbox", { name: "Select Supabase", exact: true }),
  ).toBeChecked();
  await step(page, "Authentication");
  await page.getByRole("checkbox", { name: "apple", exact: true }).click();
  await step(page, "Payments");
  await page
    .getByRole("checkbox", { name: "Select Stripe", exact: true })
    .click();
  await step(page, "AI");
  await page
    .getByRole("checkbox", { name: "Select OpenAI", exact: true })
    .click();
  await step(page, "Analytics");
  await page
    .getByRole("checkbox", { name: "Select Microsoft Clarity", exact: true })
    .click();
  await step(page, "Libraries");
  await page
    .getByRole("checkbox", { name: "Select React Hook Form", exact: true })
    .click();
  await step(page, "Review");
  await expect(page.locator(".file-content pre")).toContainText("stripe");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download pack", exact: true })
    .first()
    .click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const zip = await JSZip.loadAsync(await readFile(path!));
  expect(await zip.file("my-project/STACK.yaml")?.async("string")).toContain(
    "clarity",
  );
  expect(zip.file("my-project/rules/security.md")).toBeTruthy();
  await page.reload();
  await expect(page.locator(".file-content pre")).toContainText(
    "react-hook-form",
  );
});
test("guided answers and search navigate correctly", async ({ page }) => {
  await page.goto("/builder");
  await page.getByRole("button", { name: "Guided", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Project type", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Project name", { exact: true }).fill("test-blueprint");
  await page
    .getByRole("checkbox", { name: "Do you need payments?", exact: true })
    .click();
  await page.keyboard.press("Control+k");
  await page
    .getByRole("textbox", { name: "Search technologies", exact: true })
    .fill("Firebase Auth");
  await page
    .getByRole("button", {
      name: "Firebase Auth Managed identity for Firebase apps",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Authentication", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#tech-firebase-auth")).toHaveClass(/highlighted/);
  await page
    .getByRole("checkbox", { name: "Select Firebase Auth", exact: true })
    .click();
  await step(page, "Review");
  await expect(page.locator(".issue").first()).toContainText(
    "primary identity",
  );
  await page.reload();
  await expect(page.locator(".file-content pre")).toContainText(
    "test-blueprint",
  );
});
test("templates and technology detail interactions", async ({ page }) => {
  await page.goto("/templates");
  await page.getByRole("button", { name: "Self-hosted stack" }).click();
  await expect(page).toHaveURL(/builder/);
  await step(page, "Frontend & clients");
  await page
    .getByRole("button", { name: "About Next.js", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Next.js");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("browser AI uses a mock worker and requires download consent", async ({
  page,
}) => {
  let modelRequests = 0;
  await page.route("https://huggingface.co/**", (route) => {
    modelRequests++;
    return route.abort();
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", {
      value: { requestAdapter: async () => ({}) },
      configurable: true,
    });
    class MockWorker extends EventTarget {
      onmessage: unknown = null;
      postMessage(message: { type: string }) {
        if (message.type === "load")
          setTimeout(
            () =>
              this.dispatchEvent(
                new MessageEvent("message", { data: { type: "ready" } }),
              ),
            10,
          );
        if (message.type === "generate")
          setTimeout(() => {
            this.dispatchEvent(
              new MessageEvent("message", {
                data: {
                  type: "chunk",
                  text: "Supabase combines PostgreSQL and authentication.",
                },
              }),
            );
            this.dispatchEvent(
              new MessageEvent("message", { data: { type: "done" } }),
            );
          }, 10);
      }
      terminate() {}
    }
    Object.defineProperty(window, "Worker", { value: MockWorker });
  });
  await page.goto("/builder");
  if (
    await page
      .getByRole("button", { name: "Open project summary", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open project summary", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Ask Blueprint AI", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Download and load model", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", {
      name: "I agree to download this model under its licence",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Download and load model", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Local AI ready");
  await page
    .getByRole("textbox", { name: "Message the browser model", exact: true })
    .fill("Why is this stack a good fit?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".llm-bubble.assistant")).toContainText(
    "PostgreSQL",
  );
  expect(modelRequests).toBe(0);
});
test("API validates public generation and refuses cross-origin writes", async ({
  request,
}) => {
  const invalid = await request.post("/api/generate", {
    data: { projectName: "bad" },
  });
  expect(invalid.status()).toBe(400);
  const cross = await request.post("/api/projects", {
    headers: { origin: "https://evil.test" },
    data: {},
  });
  expect(cross.status()).toBe(403);
});

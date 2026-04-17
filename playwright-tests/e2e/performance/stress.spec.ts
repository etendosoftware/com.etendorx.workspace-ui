import { test, expect, type Page } from "@playwright/test";
import { loginToEtendo, cleanupEtendo } from "../helpers/etendo.helpers";

// ─── Drawer helper ────────────────────────────────────────────────────────────
// Opens the sidebar drawer if it is not already open.

async function openDrawer(page: Page) {
  const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
  if (!(await drawerInput.isVisible({ timeout: 1_000 }).catch(() => false))) {
    await page.locator(".h-14 > div > .transition > svg").click();
    await drawerInput.waitFor({ state: "visible", timeout: 10_000 });
  }
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe("Stress Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginToEtendo(page);
  });

  // ── Rapid Navigation Stress ────────────────────────────────────────────────

  test.describe("Rapid Navigation Stress", () => {
    test.skip("should handle rapid sequential page visits without crashing", async ({ page }) => {
      const iterations = 15;
      for (let i = 0; i < iterations; i++) {
        await page.goto("/");
        await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
        await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });
        console.log(`Navigation iteration ${i + 1}/${iterations} completed`);
      }
    });

    test("should handle rapid menu search interactions", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });

      const searchTerms = [
        "sales",
        "purchase",
        "product",
        "business",
        "invoice",
        "order",
        "warehouse",
        "payment",
        "goods",
        "report",
      ];

      await openDrawer(page);
      const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
      await drawerInput.waitFor({ state: "visible", timeout: 10_000 });

      for (let index = 0; index < searchTerms.length; index++) {
        const term = searchTerms[index];
        await drawerInput.clear();
        await page.keyboard.type(term);
        await page.waitForTimeout(300);
        console.log(`Search iteration ${index + 1}/${searchTerms.length}: "${term}"`);
      }

      await drawerInput.clear();
      await expect(page.locator("body")).toBeVisible();
    });
  });

  // ── Form Interaction Stress ────────────────────────────────────────────────

  test.describe("Form Interaction Stress", () => {
    test("should handle rapid input field interactions on login page", async ({ page }) => {
      await cleanupEtendo(page);
      await page.goto("/");
      await page.locator("#username").waitFor({ state: "visible", timeout: 10_000 });

      const iterations = 30;
      for (let i = 0; i < iterations; i++) {
        await page.locator("#username").clear();
        await page.locator("#username").fill(`user_${i}`);
        await page.locator("#password").clear();
        await page.locator("#password").fill(`pass_${i}`);
      }

      await expect(page.locator("#username")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      console.log(`Completed ${iterations} rapid form input cycles`);
    });

    test("should handle rapid click events without freezing", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });

      const clicks = 20;
      for (let i = 0; i < clicks; i++) {
        await page.locator("body").click({ force: true });
      }

      await expect(page.locator("body")).toBeVisible();
      console.log(`Completed ${clicks} rapid clicks without crash`);
    });
  });

  // ── Session Stress ─────────────────────────────────────────────────────────

  test.describe("Session Stress", () => {
    test("should handle multiple login/logout cycles", async ({ page }) => {
      const cycles = 5;
      for (let i = 0; i < cycles; i++) {
        await cleanupEtendo(page);
        await loginToEtendo(page);
        console.log(`Login/Logout cycle ${i + 1}/${cycles} completed`);
      }
    });

    test("should handle repeated failed login attempts gracefully", async ({ page }) => {
      await cleanupEtendo(page);
      const attempts = 10;

      for (let i = 0; i < attempts; i++) {
        await page.goto("/");
        await page.locator("#username").waitFor({ state: "visible", timeout: 10_000 });
        await page.locator("#username").clear();
        await page.locator("#username").fill(`invalid_user_${i}`);
        await page.locator("#password").clear();
        await page.locator("#password").fill(`invalid_pass_${i}`);
        await page.getByRole("button", { name: /Log In/i }).click();
        await page.waitForTimeout(1_000);
        console.log(`Failed login attempt ${i + 1}/${attempts}`);
      }

      await expect(page.locator("body")).toBeVisible();
      console.log("Application remained stable after repeated failed logins");
    });
  });

  // ── Memory and Resource Stress ─────────────────────────────────────────────

  test.describe("Memory and Resource Stress", () => {
    test.skip("should not exhibit excessive memory growth during navigation", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });

      // performance.memory is a non-standard Chrome-only API — skip gracefully in other browsers.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initialMemory = await page.evaluate(() => (performance as any).memory ?? null);
      if (!initialMemory) {
        console.log("Performance.memory API not available (non-Chrome browser), skipping");
        return;
      }

      const initialHeap = initialMemory.usedJSHeapSize as number;
      console.log(`Initial heap: ${(initialHeap / 1024 / 1024).toFixed(2)} MB`);

      const navIterations = 10;
      for (let i = 0; i < navIterations; i++) {
        await page.goto("/");
        await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalMemory = await page.evaluate(() => (performance as any).memory ?? null);
      if (finalMemory) {
        const finalHeap = finalMemory.usedJSHeapSize as number;
        const growthMB = (finalHeap - initialHeap) / 1024 / 1024;
        console.log(`Final heap: ${(finalHeap / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Heap growth: ${growthMB.toFixed(2)} MB`);
        expect(finalHeap, "Heap must not triple during navigation").toBeLessThan(initialHeap * 3);
      }
    });

    test("should handle many DOM queries without degradation", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });

      const queryCount = 100;
      const startTime = Date.now();

      for (let i = 0; i < queryCount; i++) {
        // count() is a lightweight DOM query — equivalent to cy.get("body").should("exist").
        await page.locator("body").count();
      }

      const elapsed = Date.now() - startTime;
      console.log(`${queryCount} DOM queries completed in ${elapsed}ms`);
      expect(elapsed, `${queryCount} DOM queries must complete within 30000ms`).toBeLessThan(30_000);
    });
  });

  // ── Concurrent Actions Stress ──────────────────────────────────────────────

  test.describe("Concurrent Actions Stress", () => {
    test("should handle search while page is still rendering", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });
      await openDrawer(page);

      const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
      await drawerInput.waitFor({ state: "visible", timeout: 15_000 });

      await page.keyboard.type("sales");
      await expect(page.locator("body")).toBeVisible();

      await drawerInput.clear();
      await page.keyboard.type("purchase");
      await expect(page.locator("body")).toBeVisible();

      await drawerInput.clear();
      await page.keyboard.type("product");
      await expect(page.locator("body")).toBeVisible();

      console.log("Application handled concurrent search/render operations");
    });

    test("should handle rapid keyboard events", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });
      await openDrawer(page);

      const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
      await drawerInput.waitFor({ state: "visible", timeout: 10_000 });
      await drawerInput.click({ force: true });

      await page.keyboard.type("abcdefghijklmnopqrstuvwxyz");
      await drawerInput.clear();
      await page.keyboard.type("1234567890");
      await drawerInput.clear();
      await page.keyboard.press("Enter");
      await page.keyboard.press("Escape");

      await expect(page.locator("body")).toBeVisible();
      console.log("Application handled rapid keyboard events without crash");
    });
  });

  // ── Error Recovery Stress ──────────────────────────────────────────────────

  test.describe("Error Recovery Stress", () => {
    test("should recover after visiting a non-existent route", async ({ page }) => {
      // Playwright does not fail on 4xx status codes by default — no failOnStatusCode needed.
      await page.goto("/non-existent-route-12345");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });

      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });
      console.log("Application recovered from 404 route");
    });

    test("should remain stable after multiple 404 navigations", async ({ page }) => {
      const badRoutes = ["/fake-page-1", "/fake-page-2", "/fake-page-3", "/another-bad-route", "/does-not-exist"];

      for (let index = 0; index < badRoutes.length; index++) {
        await page.goto(badRoutes[index]);
        await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
        console.log(`404 recovery ${index + 1}/${badRoutes.length}`);
      }

      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 10_000 });
      console.log("Application stable after multiple 404 navigations");
    });
  });
});

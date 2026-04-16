import { test, expect, type Page } from "@playwright/test";
import { loginToEtendo, cleanupEtendo } from "../helpers/etendo.helpers";

// ─── Thresholds ───────────────────────────────────────────────────────────────
// warning: target (competitive ERPs); failure: max tolerable (Nielsen 10s rule).
const THRESHOLDS = {
  loginPageLoad: { warning: 2000, failure: 5000 },
  dashboardLoad: { warning: 5000, failure: 10000 },
  lcp: { warning: 2500, failure: 4000 },
  fid: { warning: 50, failure: 100 },
  tti: { warning: 3000, failure: 5000 },
  dclTime: { warning: 3000, failure: 5000 },
  fullLoad: { warning: 5000, failure: 10000 },
  menuRender: { warning: 5000, failure: 10000 },
  searchResults: { warning: 2000, failure: 5000 },
};

type Threshold = { warning: number; failure: number };

// ─── Performance assertion ────────────────────────────────────────────────────

function assertPerformance(elapsed: number, label: string, threshold: Threshold) {
  const { warning, failure } = threshold;
  if (elapsed <= warning) {
    console.log(`✅ ${label}: ${elapsed}ms (GOOD — within target of ${warning}ms)`);
  } else if (elapsed <= failure) {
    console.log(`⚠️  ${label}: ${elapsed}ms (WARNING — exceeds target ${warning}ms, max tolerable: ${failure}ms)`);
  }
  expect(elapsed, `${label} must be under ${failure}ms (max tolerable)`).toBeLessThan(failure);
}

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

test.describe("Rendering Performance Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginToEtendo(page);
  });

  // ── Page Load Performance ──────────────────────────────────────────────────

  test.describe("Page Load Performance", () => {
    test("should load the login page within acceptable time", async ({ page }) => {
      // Clear session so the next navigation lands on the login page.
      await cleanupEtendo(page);

      const start = Date.now();
      await page.goto("/");
      await page.locator("#username").waitFor({ state: "visible", timeout: 10_000 });
      assertPerformance(Date.now() - start, "Login page load", THRESHOLDS.loginPageLoad);
    });

    test("should load the main dashboard within acceptable time after login", async ({ page }) => {
      const start = Date.now();
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });
      assertPerformance(Date.now() - start, "Dashboard load", THRESHOLDS.dashboardLoad);
    });
  });

  // ── Web Vitals Metrics ─────────────────────────────────────────────────────

  test.describe("Web Vitals Metrics", () => {
    test("should have acceptable Largest Contentful Paint (LCP)", async ({ page }) => {
      // addInitScript runs before the page loads on every subsequent navigation,
      // so the PerformanceObserver is active from the very first paint event.
      await page.addInitScript(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        w.__LCP__ = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) w.__LCP__ = lastEntry.startTime;
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
      });

      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });
      // Allow 3s for LCP to stabilise (late image loads, lazy components).
      await page.waitForTimeout(3_000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lcp = await page.evaluate(() => ((window as any).__LCP__ as number) || 0);
      console.log(`LCP: ${lcp.toFixed(2)}ms`);
      assertPerformance(lcp, "Largest Contentful Paint (LCP)", THRESHOLDS.lcp);
    });

    test("should have acceptable Cumulative Layout Shift (CLS)", async ({ page }) => {
      await page.addInitScript(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        w.__CLS__ = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const e = entry as any;
            if (!e.hadRecentInput) w.__CLS__ += e.value;
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
      });

      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });
      // Allow 5s for layout shifts to accumulate and settle.
      await page.waitForTimeout(5_000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cls = await page.evaluate(() => ((window as any).__CLS__ as number) || 0);
      console.log(`CLS Score: ${cls.toFixed(4)}`);
      // CLS is a unitless ratio — threshold is 0.25 (Google Web Vitals "poor" boundary).
      expect(cls, "CLS must be under 0.25 (Google Web Vitals threshold)").toBeLessThan(0.25);
    });

    test("should have acceptable First Input Delay (FID) simulation", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

      // Measures main-thread availability: time from a synthetic input event dispatch
      // until the browser returns control. Real FID requires an actual user interaction
      // and is only observable via PerformanceObserver in production.
      const fid = await page.evaluate(() => {
        const start = performance.now();
        document.dispatchEvent(new Event("click"));
        return performance.now() - start;
      });
      console.log(`Simulated FID: ${fid.toFixed(2)}ms`);
      assertPerformance(fid, "Simulated FID", THRESHOLDS.fid);
    });
  });

  // ── Navigation Timing ──────────────────────────────────────────────────────

  test.describe("Navigation Timing", () => {
    test("should have acceptable time to interactive", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

      const timing = await page.evaluate(() => {
        const nav = (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[])[0];
        return nav ? { domInteractive: nav.domInteractive, startTime: nav.startTime } : null;
      });

      if (timing) {
        const tti = timing.domInteractive - timing.startTime;
        console.log(`Time to Interactive: ${tti.toFixed(2)}ms`);
        assertPerformance(tti, "Time to Interactive", THRESHOLDS.tti);
      }
    });

    test("should have acceptable DOM content loaded time", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });

      const timing = await page.evaluate(() => {
        const nav = (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[])[0];
        return nav ? { domContentLoadedEventEnd: nav.domContentLoadedEventEnd, startTime: nav.startTime } : null;
      });

      if (timing) {
        const dclTime = timing.domContentLoadedEventEnd - timing.startTime;
        console.log(`DOM Content Loaded: ${dclTime.toFixed(2)}ms`);
        assertPerformance(dclTime, "DOM Content Loaded", THRESHOLDS.dclTime);
      }
    });

    test("should complete full page load within threshold", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

      const timing = await page.evaluate(() => {
        const nav = (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[])[0];
        return nav ? { loadEventEnd: nav.loadEventEnd, startTime: nav.startTime } : null;
      });

      if (timing) {
        const fullLoadTime = timing.loadEventEnd - timing.startTime;
        console.log(`Full page load: ${fullLoadTime.toFixed(2)}ms`);
        assertPerformance(fullLoadTime, "Full page load", THRESHOLDS.fullLoad);
      }
    });
  });

  // ── Resource Loading ───────────────────────────────────────────────────────

  test.describe("Resource Loading", () => {
    test("should not load excessive resources", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

      const resourceCount = await page.evaluate(() => performance.getEntriesByType("resource").length);
      console.log(`Total resources loaded: ${resourceCount}`);
      expect(resourceCount, "Total resource count must be under 200").toBeLessThan(200);
    });

    test("should not have individual resources exceeding duration threshold", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

      const slowResources = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .filter((r) => r.duration > 5000)
          .map((r) => ({ name: r.name, duration: r.duration }))
      );

      for (const r of slowResources) {
        console.log(`Slow resource: ${r.name} (${r.duration.toFixed(0)}ms)`);
      }
      expect(slowResources.length, "No more than 5 resources may exceed 5000ms").toBeLessThan(5);
    });
  });

  // ── Component Rendering ────────────────────────────────────────────────────

  test.describe("Component Rendering", () => {
    test("should render the menu search input promptly after login", async ({ page }) => {
      const start = Date.now();
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });
      // openDrawer opens the sidebar and waits internally for the input to be visible.
      await openDrawer(page);
      assertPerformance(Date.now() - start, "Menu search input render", THRESHOLDS.menuRender);
    });

    test("should render menu search results without excessive delay", async ({ page }) => {
      await page.goto("/");
      await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
      await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });
      await openDrawer(page);

      const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
      await drawerInput.waitFor({ state: "visible", timeout: 15_000 });

      const start = Date.now();
      await drawerInput.click({ force: true });
      // keyboard.type() writes into the focused element bypassing actionability pre-checks.
      await page.keyboard.type("sales");
      await page.locator('[data-testid*="MenuTitle"]').first().waitFor({ state: "visible", timeout: 10_000 });
      assertPerformance(Date.now() - start, "Menu search results render", THRESHOLDS.searchResults);
    });
  });
});

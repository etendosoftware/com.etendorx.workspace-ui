import { test, expect } from "@playwright/test";

test("ProcessMonitor i18n verification", async ({ page }) => {
  // Login
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(3000);

  const userInput = page.locator('input[name="username"], input[type="text"]').first();
  await userInput.waitFor({ timeout: 15000 });
  await userInput.fill("admin");
  await page.locator('input[type="password"]').first().fill("admin");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "/tmp/verify-3756/01-after-login.png" });

  // Find clock button
  const clockBtn = page.locator('[data-testid="ProcessMonitorButton__trigger"]');
  await clockBtn.waitFor({ timeout: 15000 });

  // Verify aria-label translation
  const ariaLabel = await clockBtn.getAttribute("aria-label");
  console.log("ARIA_LABEL:", ariaLabel);

  await page.screenshot({ path: "/tmp/verify-3756/02-clock-button.png" });

  // Open panel
  await clockBtn.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/verify-3756/03-panel-open.png" });

  // Panel title
  const titles = await page.locator('[data-testid="Typography__fac9e4"]').allTextContents();
  console.log("PANEL_TITLES:", JSON.stringify(titles));

  // Tabs
  const tabs = await page.locator(".MuiTab-root").allTextContents();
  console.log("TABS:", JSON.stringify(tabs));

  // Monitor link
  const monitorLink = page.locator('[data-testid="ProcessMonitorPanel__monitor-link"]');
  const monitorText = await monitorLink.textContent().catch(() => "NOT_FOUND");
  console.log("MONITOR_LINK_TEXT:", monitorText);

  // Old scheduling link should be gone
  const schedLink = page.locator('[data-testid="ProcessMonitorPanel__scheduling-link"]');
  const schedCount = await schedLink.count();
  console.log("OLD_SCHED_LINK_COUNT:", schedCount);

  await page.screenshot({ path: "/tmp/verify-3756/04-panel-details.png" });
});

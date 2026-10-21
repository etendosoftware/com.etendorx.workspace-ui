import type { Page, Request } from "@playwright/test";
import { expect, test } from "../../support/fixtures";
import { runAndWaitForResponse } from "../../support/wait";

/**
 * Inline grid editing (Insert Row / Edit in grid) saves through the same datasource as the form
 * view. Each test pins a bug found in the 2026-10-21 audit: duplicate inserts, retried server
 * errors, lost keystrokes, auto-save while a dropdown opens and stale rows after a save.
 */

const SAVE_URL = /\/api\/datasource\/.*_operationType=(add|update)/;

/** Records every inline save request (add/update) the page sends from now on. */
function trackSaves(page: Page): Request[] {
  const saves: Request[] = [];
  page.on("request", (request) => {
    if (SAVE_URL.test(request.url())) saves.push(request);
  });
  return saves;
}

const sentData = (request: Request) => JSON.parse(request.postData() ?? "{}").data ?? {};

test.describe("Master Data - Inline grid editing @smoke", () => {
  test("Enter saves a new row exactly once", async ({ app, data, page }) => {
    const name = data.uniqueValue("PW Enter");
    await app.sidebar.navigateTo("title");
    const row = await app.grid.insertRow();
    await row.getByPlaceholder("Enter Name...").fill(name);
    await row.getByPlaceholder("Enter Title...").fill(name);

    const saves = trackSaves(page);
    await runAndWaitForResponse(page, SAVE_URL, () => row.getByPlaceholder("Enter Title...").press("Enter"));
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);

    expect(saves).toHaveLength(1);
    await app.grid.filter("Name", name);
    await expect(page.locator("tbody tr:visible").filter({ hasText: name })).toHaveCount(1);
  });

  test("a rejected new row is sent once and stays editable with the server message", async ({ app, data, page }) => {
    const searchKey = data.uniqueValue("PWDUP");
    await app.sidebar.navigateTo("businessPartnerCategory");

    const first = await app.grid.insertRow();
    await first.getByPlaceholder("Enter Search Key...").fill(searchKey);
    await first.getByPlaceholder("Enter Name...").fill(searchKey);
    await runAndWaitForResponse(page, SAVE_URL, () => first.locator('[data-testid^="save-button-new_"]').click());
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);

    const duplicate = await app.grid.insertRow();
    await duplicate.getByPlaceholder("Enter Search Key...").fill(searchKey);
    await duplicate.getByPlaceholder("Enter Name...").fill(`${searchKey} again`);
    const saves = trackSaves(page);
    await duplicate.locator('[data-testid^="save-button-new_"]').click();

    await expect(page.getByText(/must be unique/).first()).toBeVisible();
    expect(saves).toHaveLength(1);
    await expect(duplicate.getByPlaceholder("Enter Search Key...")).toHaveValue(searchKey);
  });

  test("every typed character is saved, even at scanner speed", async ({ app, data, page }) => {
    const name = data.uniqueValue("PW fast typing");
    await app.sidebar.navigateTo("title");
    const row = await app.grid.insertRow();
    await row.getByPlaceholder("Enter Name...").pressSequentially(name, { delay: 0 });
    await row.getByPlaceholder("Enter Title...").fill(name);

    const response = await runAndWaitForResponse(page, SAVE_URL, () =>
      row.locator('[data-testid^="save-button-new_"]').click()
    );

    expect(sentData(response.request()).name).toBe(name);
  });

  test("opening a dropdown of a new row does not save it", async ({ app, data, page }) => {
    const name = data.uniqueValue("PW dropdown");
    await app.sidebar.navigateTo("title");
    const row = await app.grid.insertRow();
    await row.getByPlaceholder("Enter Name...").fill(name);
    await row.getByPlaceholder("Enter Title...").fill(name);

    const saves = trackSaves(page);
    await row.locator('[data-column-id="organization"]').click();
    const search = page.getByPlaceholder("Search Organization...");
    await search.click();
    await expect(page.getByRole("menu").getByText("Spain", { exact: true })).toBeVisible();

    expect(saves).toHaveLength(0);
    await expect(row.locator('[data-testid^="save-button-new_"]')).toBeVisible();
  });

  test("a row edited several times in a row always shows and saves its latest values", async ({ app, data, page }) => {
    const base = data.uniqueValue("PW edit");
    await app.sidebar.navigateTo("title");
    const row = await app.grid.insertRow();
    await row.getByPlaceholder("Enter Name...").fill(base);
    await row.getByPlaceholder("Enter Title...").fill(base);
    await runAndWaitForResponse(page, SAVE_URL, () => row.locator('[data-testid^="save-button-new_"]').click());
    await expect(page.locator('[data-testid^="save-button-new_"]')).toHaveCount(0);

    let current = base;
    for (const suffix of ["A", "B", "C"]) {
      const next = `${base} ${suffix}`;
      const editing = await app.grid.editRow(current);
      await editing.getByPlaceholder("Enter Name...").fill(next);

      const response = await runAndWaitForResponse(page, SAVE_URL, () =>
        editing.locator('[data-testid^="save-button-"]').click()
      );
      expect(response.status()).toBe(200);
      expect((await response.json()).response?.status).toBe(0);

      await expect(app.grid.editingRow()).toHaveCount(0);
      await expect(page.locator("tbody tr:visible").filter({ hasText: next })).toHaveCount(1);
      current = next;
    }
  });
});

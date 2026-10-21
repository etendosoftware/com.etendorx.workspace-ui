import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "../support/fixtures";
import { isComparable, recordingDrift } from "../support/mock/drift";
import { readHarEntries } from "../support/mock/replay";

const RECORDINGS_DIR = fileURLToPath(new URL("../mocked/recordings/", import.meta.url));
const TOKEN_STORAGE_KEY = "token";

/**
 * Drift guard: every side-effect-free JSON response of the mocked-backend recordings is requested
 * again from the live backend, and its shape must still match. When it fails, the recordings are
 * outdated: regenerate them with `pnpm pw:record` (after checking the change is intended).
 */
test.describe("Mocked backend - recordings match the live backend", () => {
  test("the live backend answers every recorded request with the recorded shape", async ({ app, page }) => {
    const files = readdirSync(RECORDINGS_DIR)
      .filter((file) => file.endsWith(".har.gz"))
      .map((file) => join(RECORDINGS_DIR, file));
    const entries = readHarEntries(files).filter(isComparable);
    expect(entries.length, "no recordings to compare").toBeGreaterThan(0);
    const token = await app.page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY);

    const drift: string[] = [];
    for (const entry of entries) {
      const response = await page.request.fetch(entry.request.url, {
        method: entry.request.method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        data: entry.request.postData?.text,
      });
      drift.push(...recordingDrift(entry, await response.text()));
    }
    expect(drift, "recordings no longer match the backend: check the change, then pnpm pw:record").toEqual([]);
  });
});

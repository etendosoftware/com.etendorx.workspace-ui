import type { Page } from "@playwright/test";

/** A request a spec forbids: whether the page tried to send it. */
export interface BlockedRequest {
  readonly sent: boolean;
}

/**
 * Aborts every request whose URL matches `url` and records that it was attempted. A safety net
 * for specs that must stop before an action reaches the backend (e.g. a validation that aborts a
 * payment): the action can never change the database, and the spec asserts `sent` stayed false.
 */
export async function blockRequests(page: Page, url: RegExp): Promise<BlockedRequest> {
  const state = { sent: false };
  await page.route(url, (route) => {
    state.sent = true;
    return route.abort();
  });
  return state;
}

/**
 * Answers every request whose URL matches `url` with `status` instead of sending it to the backend, and
 * records that it was attempted. Simulates a server failure (500) or a rejected session (401) on one
 * service without changing any data or configuration.
 */
export async function answerWithStatus(page: Page, url: RegExp, status: number): Promise<BlockedRequest> {
  const state = { sent: false };
  await page.route(url, (route) => {
    state.sent = true;
    return route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: `Simulated ${status} answer` }),
    });
  });
  return state;
}

/** A file a simulated answer downloads. */
export interface SimulatedFile {
  contentType: string;
  fileName: string;
  body: string;
}

/**
 * Answers every request whose URL matches `url` with a file download, and records that it was attempted. For
 * documents the local server cannot generate (a Jasper report on a server that cannot compile it): the spec still
 * checks the request the UI sends and the download it makes.
 */
export async function answerWithFile(page: Page, url: RegExp, file: SimulatedFile): Promise<BlockedRequest> {
  const state = { sent: false };
  await page.route(url, (route) => {
    state.sent = true;
    return route.fulfill({
      status: 200,
      contentType: file.contentType,
      headers: { "Content-Disposition": `attachment; filename="${file.fileName}"` },
      body: file.body,
    });
  });
  return state;
}

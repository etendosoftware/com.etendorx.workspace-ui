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

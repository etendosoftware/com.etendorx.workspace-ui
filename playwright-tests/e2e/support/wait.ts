/**
 * Waiting policy: wait for a network response or a UI state, never for a fixed time.
 *
 * Etendo keeps SSE connections open, so `waitForLoadState("networkidle")` never settles; wait
 * for the specific request the action triggers instead.
 */
import { expect, type Page, type Response } from "@playwright/test";

/** Full-screen overlay shown while the app loads or saves; it intercepts pointer events. */
export const LOADING_OVERLAY = "div.absolute.h-screen.w-screen";

const FORM_INITIALIZATION_URL = /FormInitializationComponent/;
const DATASOURCE_URL = /api\/datasource/;
const DEFAULT_RESPONSE_TIMEOUT = 30_000;
const OVERLAY_TIMEOUT = 20_000;

/** Waits until the loading overlay is gone. Fails if it is still there after the timeout. */
export async function waitForNoOverlay(page: Page, timeout = OVERLAY_TIMEOUT): Promise<void> {
  await expect(page.locator(LOADING_OVERLAY)).toHaveCount(0, { timeout });
}

/**
 * Runs `action` and waits for the first response whose URL matches `url` (or that `url` accepts).
 * The listener is registered before the action, so a fast response is never missed.
 */
export async function runAndWaitForResponse(
  page: Page,
  url: RegExp | ((response: Response) => boolean),
  action: () => Promise<unknown>,
  timeout = DEFAULT_RESPONSE_TIMEOUT
): Promise<Response> {
  const response = page.waitForResponse(url, { timeout });
  await action();
  return response;
}

/** Runs `action` (e.g. picking a product) and waits for the FormInitialization callout response. */
export function runAndWaitForFormInitialization(page: Page, action: () => Promise<unknown>, timeout?: number) {
  return runAndWaitForResponse(page, FORM_INITIALIZATION_URL, action, timeout);
}

/** Runs `action` (e.g. applying a grid filter) and waits for the datasource response. */
export function runAndWaitForDatasource(page: Page, action: () => Promise<unknown>, timeout?: number) {
  return runAndWaitForResponse(page, DATASOURCE_URL, action, timeout);
}

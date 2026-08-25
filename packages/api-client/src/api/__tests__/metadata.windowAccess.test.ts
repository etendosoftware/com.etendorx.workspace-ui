/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Metadata } from "../metadata";
import { WINDOW_NOT_FOUND_ERROR_MESSAGE, isWindowAccessDeniedError } from "../errors";

jest.mock("../cache", () => ({
  CacheStore: jest.fn().mockImplementation(() => {
    const store = new Map();
    return {
      get: jest.fn((key) => store.get(key)),
      set: jest.fn((key, value) => store.set(key, value)),
      clear: jest.fn(() => store.clear()),
      delete: jest.fn((key) => store.delete(key)),
    };
  }),
}));

const WINDOW_ID = "102";
const TAB_ID = "107";
const ROLE_ID = "test-role";

/** Mirrors the shape of `Metadata.client.post` responses for the window endpoint. */
type WindowResponse = { ok: boolean; status?: number; data?: unknown };

/** Reaches into the private statics of `Metadata` so each test starts from a clean slate. */
// biome-ignore lint/suspicious/noExplicitAny: private statics are the only way to reset the cache
const metadataInternals = () => Metadata as any;

describe("Metadata window access classification", () => {
  let postSpy: jest.SpyInstance;

  const mockWindowResponse = (response: WindowResponse) => {
    postSpy.mockResolvedValue(response as never);
  };

  const loadWindow = () => Metadata.forceWindowReload(WINDOW_ID);

  const buildPayload = (isWindowAccessible?: boolean) => ({
    id: WINDOW_ID,
    tabs: [{ id: TAB_ID }],
    ...(isWindowAccessible === undefined ? {} : { isWindowAccessible }),
  });

  const cachedKeys = () => metadataInternals().cache.set.mock.calls.map((call: unknown[]) => call[0]);

  /** Returns the rejection reason so its type can be asserted, since jest-extended is not loaded. */
  const captureRejection = async (promise: Promise<unknown>): Promise<unknown> => {
    try {
      await promise;
    } catch (error) {
      return error;
    }
    throw new Error("Expected the promise to reject");
  };

  beforeEach(() => {
    jest.clearAllMocks();
    metadataInternals().currentRoleId = ROLE_ID;
    metadataInternals().cache.clear();
    metadataInternals().pendingRequests?.clear();
    jest.clearAllMocks();

    postSpy = jest.spyOn(Metadata.client, "post");
  });

  it("throws the typed error and caches nothing on a 401", async () => {
    mockWindowResponse({ ok: false, status: 401 });

    const error = await captureRejection(loadWindow());

    expect(isWindowAccessDeniedError(error)).toBe(true);
    expect(cachedKeys()).toEqual([]);
  });

  it("throws the typed error and caches nothing when the ERP reports no role access", async () => {
    mockWindowResponse({ ok: true, status: 200, data: buildPayload(false) });

    const error = await captureRejection(loadWindow());

    expect(isWindowAccessDeniedError(error)).toBe(true);
    expect(cachedKeys()).toEqual([]);
  });

  it.each([
    ["404", 404],
    ["500", 500],
    ["a response without status", undefined],
  ])("keeps the legacy message on %s", async (_label, status) => {
    mockWindowResponse({ ok: false, status });

    const error = await captureRejection(loadWindow());

    expect(isWindowAccessDeniedError(error)).toBe(false);
    expect((error as Error).message).toBe(WINDOW_NOT_FOUND_ERROR_MESSAGE);
  });

  it.each([
    ["the role has explicit access", true],
    ["the backend does not send the flag", undefined],
  ])("resolves and caches the window and its tabs when %s", async (_label, isWindowAccessible) => {
    mockWindowResponse({ ok: true, status: 200, data: buildPayload(isWindowAccessible) });

    const result = await loadWindow();

    expect(result.id).toBe(WINDOW_ID);
    expect(cachedKeys()).toEqual([`window-${WINDOW_ID}-${ROLE_ID}`, `tab-${TAB_ID}-${ROLE_ID}`]);
  });
});

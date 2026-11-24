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

import { applyForcedLoginUrl, getForcedLoginRedirect, LOGIN_CONFIG_PATH } from "../forcedLoginUrl";

jest.mock("@/utils/logger");

const UI = "https://ui.example.com/";
const CURRENT = "http://ui.example.com/window?wi_0=143_1";

describe("getForcedLoginRedirect", () => {
  it("moves to the configured address of the new UI", () => {
    expect(getForcedLoginRedirect(UI, CURRENT)).toBe(UI);
  });

  it.each([
    ["no preference", "", CURRENT],
    ["the page is already reached through it", UI, `${UI}window`],
    ["it is the classic login page", "https://erp.example.com/etendo/security/Login", CURRENT],
    ["it is not an address", "not a url", CURRENT],
  ])("stays when %s", (_case, value, current) => {
    expect(getForcedLoginRedirect(value, current)).toBeUndefined();
  });
});

describe("applyForcedLoginUrl", () => {
  const replace = jest.fn();
  const originalLocation = window.location;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "location", { configurable: true, value: { href: CURRENT, replace } });
  });

  afterAll(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    global.fetch = originalFetch;
  });

  it("reads the configuration and moves the page", async () => {
    global.fetch = jest.fn(async () => ({ json: async () => ({ forcedLoginUrl: UI }) })) as unknown as typeof fetch;

    await applyForcedLoginUrl();

    expect(global.fetch).toHaveBeenCalledWith(LOGIN_CONFIG_PATH);
    expect(replace).toHaveBeenCalledWith(UI);
  });

  it("keeps the login page when the configuration cannot be read", async () => {
    global.fetch = jest.fn(async () => Promise.reject(new Error("down"))) as unknown as typeof fetch;

    await expect(applyForcedLoginUrl()).resolves.toBeUndefined();
    expect(replace).not.toHaveBeenCalled();
  });
});

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

import type { SSOConfig } from "@/hooks/useSSO";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import {
  buildSsoLinkBody,
  closeSsoProviderSession,
  isSsoAccountLinkingEnabled,
  PROVIDER_LOGOUT_DELAY_MS,
} from "../ssoProvider";

const AUTH0: SSOConfig = {
  enabled: true,
  authType: "Auth0",
  domain: "etendo.auth0.com",
  clientId: "abc123",
  callbackUrl: "",
};
const MIDDLEWARE: SSOConfig = {
  enabled: true,
  authType: "Middleware",
  middlewareUrl: "https://sso.etendo.cloud",
  redirectUri: "",
  accountId: "acc-1",
  providers: [],
};
const ORIGIN = "https://ui.example";
const ALLOW_SSO = { ETRX_AllowSSOLogin: "Y" };

describe("ssoProvider", () => {
  beforeEach(() => {
    installLocalStorageMock();
    savePreferences(ALLOW_SSO);
  });

  describe("isSsoAccountLinkingEnabled", () => {
    it("is enabled only with single sign-on configured and the preference set to Y", () => {
      expect(isSsoAccountLinkingEnabled(MIDDLEWARE)).toBe(true);
      expect(isSsoAccountLinkingEnabled({ enabled: false })).toBe(false);
      expect(isSsoAccountLinkingEnabled(null)).toBe(false);
      savePreferences({});
      expect(isSsoAccountLinkingEnabled(MIDDLEWARE)).toBe(false);
    });
  });

  describe("buildSsoLinkBody", () => {
    it("links an Auth0 code whose state matches", () => {
      expect(buildSsoLinkBody(new URLSearchParams("code=c1&state=s1"), "s1", ORIGIN)).toEqual({
        code: "c1",
        redirectUri: `${ORIGIN}/sso/link-callback`,
      });
    });

    it("links a middleware access token", () => {
      expect(buildSsoLinkBody(new URLSearchParams("access_token=t1"), null, ORIGIN)).toEqual({ accessToken: "t1" });
    });

    it.each([
      ["a code with another state", "code=c1&state=other", "s1"],
      ["a code without a stored state", "code=c1&state=s1", null],
      ["nothing to link", "", null],
    ])("refuses %s", (_case, query, state) => {
      expect(buildSsoLinkBody(new URLSearchParams(query), state, ORIGIN)).toBeNull();
    });
  });

  describe("closeSsoProviderSession", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("opens the Auth0 logout in a popup and closes it after a second", () => {
      const popup = { close: jest.fn() };
      const open = jest.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

      closeSsoProviderSession(AUTH0);

      const url = new URL(String(open.mock.calls[0][0]));
      expect(`${url.origin}${url.pathname}`).toBe("https://etendo.auth0.com/v2/logout");
      expect(url.searchParams.get("client_id")).toBe("abc123");
      jest.advanceTimersByTime(PROVIDER_LOGOUT_DELAY_MS);
      expect(popup.close).toHaveBeenCalled();
      open.mockRestore();
    });

    it("calls the middleware logout in a hidden frame and removes it after a second", () => {
      closeSsoProviderSession(MIDDLEWARE);

      const frame = document.querySelector("iframe");
      expect(frame?.getAttribute("src")).toBe("https://sso.etendo.cloud/logout");
      jest.advanceTimersByTime(PROVIDER_LOGOUT_DELAY_MS);
      expect(document.querySelector("iframe")).toBeNull();
    });

    it("does nothing without the preference", () => {
      savePreferences({});
      const open = jest.spyOn(window, "open");

      closeSsoProviderSession(AUTH0);
      closeSsoProviderSession(MIDDLEWARE);

      expect(open).not.toHaveBeenCalled();
      expect(document.querySelector("iframe")).toBeNull();
      open.mockRestore();
    });
  });
});

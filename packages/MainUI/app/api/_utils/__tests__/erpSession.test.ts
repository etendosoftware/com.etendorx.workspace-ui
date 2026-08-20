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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { extractCsrfToken, extractJSessionId, handOffErpSession, storeErpSession } from "../erpSession";
import {
  setErpSessionCookie,
  setErpCsrfToken,
  getErpSessionCookie,
  getErpCsrfToken,
  clearErpSessionCookie,
} from "../sessionStore";

jest.mock("../sessionStore", () => ({
  setErpSessionCookie: jest.fn(),
  setErpCsrfToken: jest.fn(),
  getErpSessionCookie: jest.fn(),
  getErpCsrfToken: jest.fn(),
  clearErpSessionCookie: jest.fn(),
}));

const OLD_TOKEN = "old-jwt";
const NEW_TOKEN = "new-jwt";
const OLD_COOKIE = "JSESSIONID=OLD123";
const OLD_CSRF = "csrf-old";
const NEW_CSRF = "csrf-new";

interface ResponseOptions {
  setCookie?: string[];
  singleSetCookie?: string;
  csrf?: string;
}

/** Builds a minimal ERP-like response carrying the given headers. */
function buildResponse({ setCookie, singleSetCookie, csrf }: ResponseOptions = {}): Response {
  return {
    headers: {
      get: (name: string) => {
        const lowered = name.toLowerCase();
        if (lowered === "x-csrf-token") return csrf ?? null;
        if (lowered === "set-cookie") return singleSetCookie ?? null;
        return null;
      },
      getSetCookie: () => setCookie,
    },
  } as unknown as Response;
}

/** Makes the store report an existing entry for the previous token. */
function stubStoredSession({ cookie, csrf }: { cookie?: string | null; csrf?: string | null }) {
  (getErpSessionCookie as jest.Mock).mockReturnValue(cookie ?? null);
  (getErpCsrfToken as jest.Mock).mockReturnValue(csrf ?? null);
}

describe("_utils/erpSession", () => {
  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) so a per-test mockImplementation cannot leak forward.
    jest.resetAllMocks();
    stubStoredSession({});
  });

  describe("extractJSessionId", () => {
    it("reads the value from getSetCookie()", () => {
      const response = buildResponse({ setCookie: ["OTHER=1; Path=/", "JSESSIONID=ABC; Path=/; HttpOnly"] });

      expect(extractJSessionId(response)).toBe("ABC");
    });

    it("falls back to the concatenated set-cookie header", () => {
      const response = buildResponse({ singleSetCookie: "OTHER=1, JSESSIONID=XYZ; Path=/" });

      expect(extractJSessionId(response)).toBe("XYZ");
    });

    it("returns null when the response carries no JSESSIONID", () => {
      expect(extractJSessionId(buildResponse({ setCookie: ["OTHER=1"] }))).toBeNull();
      expect(extractJSessionId(buildResponse())).toBeNull();
    });
  });

  describe("extractCsrfToken", () => {
    it("reads the header regardless of casing", () => {
      expect(extractCsrfToken(buildResponse({ csrf: NEW_CSRF }))).toBe(NEW_CSRF);
    });

    it("returns null when the header is absent", () => {
      expect(extractCsrfToken(buildResponse())).toBeNull();
    });
  });

  describe("storeErpSession", () => {
    it("stores the cookie and CSRF token under the given token", () => {
      storeErpSession(buildResponse({ setCookie: ["JSESSIONID=ABC"], csrf: NEW_CSRF }), NEW_TOKEN);

      expect(setErpSessionCookie).toHaveBeenCalledWith(NEW_TOKEN, {
        cookieHeader: "JSESSIONID=ABC",
        csrfToken: NEW_CSRF,
      });
    });

    // Storing "JSESSIONID=null" would poison the store for every later proxied request.
    it("stores only the CSRF token when there is no JSESSIONID", () => {
      storeErpSession(buildResponse({ csrf: NEW_CSRF }), NEW_TOKEN);

      expect(setErpSessionCookie).not.toHaveBeenCalled();
      expect(setErpCsrfToken).toHaveBeenCalledWith(NEW_TOKEN, NEW_CSRF);
    });

    it("stores nothing when the response carries neither", () => {
      storeErpSession(buildResponse(), NEW_TOKEN);

      expect(setErpSessionCookie).not.toHaveBeenCalled();
      expect(setErpCsrfToken).not.toHaveBeenCalled();
    });

    it("throws a wrapped error when the store rejects the value", () => {
      (setErpSessionCookie as jest.Mock).mockImplementation(() => {
        throw new Error("invalid");
      });

      expect(() => storeErpSession(buildResponse({ setCookie: ["JSESSIONID=ABC"] }), NEW_TOKEN)).toThrow(
        "Failed to store session cookie"
      );
    });
  });

  describe("handOffErpSession", () => {
    it("moves a freshly issued session to the new token and drops the old entry", () => {
      handOffErpSession(buildResponse({ setCookie: ["JSESSIONID=NEW1"], csrf: NEW_CSRF }), NEW_TOKEN, OLD_TOKEN);

      expect(setErpSessionCookie).toHaveBeenCalledWith(NEW_TOKEN, {
        cookieHeader: "JSESSIONID=NEW1",
        csrfToken: NEW_CSRF,
      });
      expect(clearErpSessionCookie).toHaveBeenCalledWith(OLD_TOKEN);
    });

    it("carries over the stored JSESSIONID when the ERP did not issue a new one", () => {
      stubStoredSession({ cookie: OLD_COOKIE, csrf: OLD_CSRF });

      handOffErpSession(buildResponse(), NEW_TOKEN, OLD_TOKEN);

      expect(setErpSessionCookie).toHaveBeenCalledWith(NEW_TOKEN, {
        cookieHeader: OLD_COOKIE,
        csrfToken: OLD_CSRF,
      });
    });

    // setErpSessionCookie mints a brand new CSRF token when it receives null, which would discard
    // the one the ERP already knows about and break saves with InvalidCSRFToken.
    it("carries over the stored CSRF token when the ERP did not issue a new one", () => {
      stubStoredSession({ cookie: null, csrf: OLD_CSRF });

      handOffErpSession(buildResponse({ setCookie: ["JSESSIONID=NEW1"] }), NEW_TOKEN, OLD_TOKEN);

      expect(setErpSessionCookie).toHaveBeenCalledWith(NEW_TOKEN, {
        cookieHeader: "JSESSIONID=NEW1",
        csrfToken: OLD_CSRF,
      });
    });

    it("lets a freshly issued JSESSIONID win over the stored one", () => {
      stubStoredSession({ cookie: OLD_COOKIE, csrf: OLD_CSRF });

      handOffErpSession(buildResponse({ setCookie: ["JSESSIONID=NEW1"], csrf: NEW_CSRF }), NEW_TOKEN, OLD_TOKEN);

      expect(setErpSessionCookie).toHaveBeenCalledWith(NEW_TOKEN, {
        cookieHeader: "JSESSIONID=NEW1",
        csrfToken: NEW_CSRF,
      });
    });

    it("stores only the CSRF token when no cookie is available anywhere", () => {
      stubStoredSession({ cookie: null, csrf: OLD_CSRF });

      handOffErpSession(buildResponse(), NEW_TOKEN, OLD_TOKEN);

      expect(setErpSessionCookie).not.toHaveBeenCalled();
      expect(setErpCsrfToken).toHaveBeenCalledWith(NEW_TOKEN, OLD_CSRF);
      expect(clearErpSessionCookie).toHaveBeenCalledWith(OLD_TOKEN);
    });

    it("keeps the entry when the ERP returned the very same token", () => {
      stubStoredSession({ cookie: OLD_COOKIE, csrf: OLD_CSRF });

      handOffErpSession(buildResponse(), OLD_TOKEN, OLD_TOKEN);

      expect(clearErpSessionCookie).not.toHaveBeenCalled();
    });
  });
});

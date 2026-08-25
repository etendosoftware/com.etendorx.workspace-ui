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

import { decodeTokenPayload, getTokenExpiration, isTokenExpired } from "../token";
import { buildToken, encodeBase64Url } from "@/utils/testUtils/sessionTokens";

const EXP_SECONDS = 1_700_000_000;

describe("session/token", () => {
  describe("decodeTokenPayload", () => {
    it("decodes a standard payload", () => {
      const token = buildToken({ user: "U1", role: "R1", exp: EXP_SECONDS });

      expect(decodeTokenPayload(token)).toEqual({ user: "U1", role: "R1", exp: EXP_SECONDS });
    });

    it("decodes a payload whose base64url encoding contains both - and _", () => {
      const payload = { user: "s??", role: "o>>" };
      const token = buildToken(payload);
      const encoded = token.split(".")[1];

      expect(encoded).toContain("-");
      expect(encoded).toContain("_");
      expect(decodeTokenPayload(token)).toEqual(payload);
    });

    it("decodes a payload whose base64url encoding needs padding restored", () => {
      const payload = { user: "s??" };
      const token = buildToken(payload);

      expect(token.split(".")[1].length % 4).not.toBe(0);
      expect(decodeTokenPayload(token)).toEqual(payload);
    });

    it("returns null for a null or empty token", () => {
      expect(decodeTokenPayload(null)).toBeNull();
      expect(decodeTokenPayload(undefined)).toBeNull();
      expect(decodeTokenPayload("")).toBeNull();
    });

    it("returns null for a token with fewer than two segments", () => {
      expect(decodeTokenPayload("onlyonesegment")).toBeNull();
    });

    it("returns null when the payload is not valid JSON", () => {
      expect(decodeTokenPayload(`header.${encodeBase64Url("not-json")}.signature`)).toBeNull();
    });

    it("returns null when the payload is not valid base64", () => {
      expect(decodeTokenPayload("header.!!!!.signature")).toBeNull();
    });
  });

  describe("getTokenExpiration", () => {
    it("returns the expiration in milliseconds", () => {
      expect(getTokenExpiration(buildToken({ exp: EXP_SECONDS }))).toBe(EXP_SECONDS * 1000);
    });

    // The instance-wide switch: SMFSWS_Config.Expirationtime = 0 means no exp claim at all.
    it("returns null when the token carries no exp claim", () => {
      expect(getTokenExpiration(buildToken({ user: "U1" }))).toBeNull();
    });

    it("returns null when exp is not a number", () => {
      expect(getTokenExpiration(buildToken({ exp: "soon" }))).toBeNull();
    });

    it("returns null for a malformed token", () => {
      expect(getTokenExpiration("garbage")).toBeNull();
      expect(getTokenExpiration(null)).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    const EXP_MS = EXP_SECONDS * 1000;

    it("reports an expired token", () => {
      expect(isTokenExpired(buildToken({ exp: EXP_SECONDS }), EXP_MS + 1)).toBe(true);
    });

    it("reports expiry at the exact expiration instant", () => {
      expect(isTokenExpired(buildToken({ exp: EXP_SECONDS }), EXP_MS)).toBe(true);
    });

    it("reports a still-valid token as not expired", () => {
      expect(isTokenExpired(buildToken({ exp: EXP_SECONDS }), EXP_MS - 1)).toBe(false);
    });

    // Guarantees every caller stays inert while SMFSWS_Config.Expirationtime is 0.
    it("never reports a token without exp as expired", () => {
      expect(isTokenExpired(buildToken({ user: "U1" }), Number.MAX_SAFE_INTEGER)).toBe(false);
    });

    it("never reports a missing or malformed token as expired", () => {
      expect(isTokenExpired(null, EXP_MS + 1)).toBe(false);
      expect(isTokenExpired("garbage", EXP_MS + 1)).toBe(false);
    });
  });
});

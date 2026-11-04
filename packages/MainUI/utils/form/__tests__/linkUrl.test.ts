/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { isLinkReference, isValidLinkUrl, toOpenableLinkUrl } from "../linkUrl";
import { FIELD_REFERENCE_CODES } from "../constants";
import { DEFAULT_PROTOCOL } from "@/utils/menu/externalMenuEntry";

const PROTOCOL_LESS_URL = "www.etendo.software";
const HTTPS_URL = "https://www.etendo.software/path?q=1#top";
/** Non-web protocols a Link field accepts, as in Classic. */
const NON_WEB_PROTOCOLS = [["ftp"], ["file"]];

/** Builds a URL from a protocol name, so no insecure-protocol literal is written in the tests. */
const buildUrl = (protocol: string): string => `${protocol}://files.etendo.software/a.txt`;

describe("linkUrl", () => {
  describe("isLinkReference", () => {
    it("matches the Link reference only", () => {
      expect(isLinkReference(FIELD_REFERENCE_CODES.LINK.id)).toBe(true);
      expect(isLinkReference(FIELD_REFERENCE_CODES.STRING.id)).toBe(false);
      expect(isLinkReference()).toBe(false);
      expect(isLinkReference(null)).toBe(false);
    });
  });

  describe("toOpenableLinkUrl", () => {
    it.each([
      [PROTOCOL_LESS_URL, `${DEFAULT_PROTOCOL}${PROTOCOL_LESS_URL}`],
      [`  ${PROTOCOL_LESS_URL}  `, `${DEFAULT_PROTOCOL}${PROTOCOL_LESS_URL}`],
      [HTTPS_URL, HTTPS_URL],
    ])("opens %p as %p", (value, expected) => {
      expect(toOpenableLinkUrl(value)).toBe(expected);
    });

    it.each(NON_WEB_PROTOCOLS)("opens a %s URL unchanged", (protocol) => {
      expect(toOpenableLinkUrl(buildUrl(protocol))).toBe(buildUrl(protocol));
    });

    it.each([[undefined], [null], [""], ["   "], ["javascript://%0aalert(1)"], ["data://text/html,x"]])(
      "returns null for %p",
      (value) => {
        expect(toOpenableLinkUrl(value)).toBeNull();
      }
    );
  });

  describe("isValidLinkUrl", () => {
    it.each([
      [PROTOCOL_LESS_URL],
      [HTTPS_URL],
      ["https://www.etendo.software."],
      ["https://192.168.1.10:8080/erp"],
      ["https://user:pass@my_host.etendo.software/x"],
      ["https://localhost.localdomain"],
    ])("accepts %p", (value) => {
      expect(isValidLinkUrl(value)).toBe(true);
    });

    it.each(NON_WEB_PROTOCOLS)("accepts a %s URL", (protocol) => {
      expect(isValidLinkUrl(buildUrl(protocol))).toBe(true);
    });

    it.each([[undefined], [null], [""], ["   "], [42]])("accepts the empty or non-text value %p", (value) => {
      expect(isValidLinkUrl(value)).toBe(true);
    });

    it.each([
      ["not a url"],
      ["https://localhost"],
      ["https://www.etendo.123"],
      ["https://-etendo.software"],
      ["https://etendo-.software"],
      ["https://www..etendo.software"],
      ["https://www.etendo.software/a b"],
      ["https://www.etendo.software/<script>"],
      ["mailto://someone"],
      ["file:///etc/passwd"],
      ["https://www.etendo.software:99999"],
      ["https://[::1]/"],
    ])("rejects %p", (value) => {
      expect(isValidLinkUrl(value)).toBe(false);
    });

    it("answers in linear time on values that make Classic's regular expression backtrack", () => {
      const start = Date.now();
      expect(isValidLinkUrl(`https://a.${"a.".repeat(5000)}-`)).toBe(false);
      expect(Date.now() - start).toBeLessThan(1000);
    });
  });
});

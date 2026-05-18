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

import { getLanguageFlag } from "../languageFlags";

describe("languageFlags utils", () => {
  describe("getLanguageFlag", () => {
    it("should return the correct flag for a valid language code", () => {
      expect(getLanguageFlag("es_ES")).toBe("🇪🇸");
      expect(getLanguageFlag("en_US")).toBe("🇺🇸");
      expect(getLanguageFlag("fr_FR")).toBe("🇫🇷");
    });

    it("should return the fallback flag for an unknown language code", () => {
      expect(getLanguageFlag("unknown_CODE")).toBe("🌐");
    });

    it("should return the fallback flag for null or undefined", () => {
      expect(getLanguageFlag(null)).toBe("🌐");
      expect(getLanguageFlag("")).toBe("🌐");
    });
  });
});

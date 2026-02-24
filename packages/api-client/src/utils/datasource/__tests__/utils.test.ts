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

import { isWrappedWithAt } from "../utils";

describe("Datasource Utils", () => {
  describe("isWrappedWithAt", () => {
    it("should return true for valid wrapped strings", () => {
      expect(isWrappedWithAt("@TEST@")).toBe(true);
      expect(isWrappedWithAt("@a@")).toBe(true);
      expect(isWrappedWithAt("@Long_Variable_Name@")).toBe(true);
    });

    it("should return false for invalid strings", () => {
      expect(isWrappedWithAt("@")).toBe(false);
      expect(isWrappedWithAt("@@")).toBe(false);
      expect(isWrappedWithAt("TEST@")).toBe(false);
      expect(isWrappedWithAt("@TEST")).toBe(false);
      expect(isWrappedWithAt("TEST")).toBe(false);
      expect(isWrappedWithAt("@ @")).toBe(true); // Technically valid by regex [^@]+
    });
  });
});

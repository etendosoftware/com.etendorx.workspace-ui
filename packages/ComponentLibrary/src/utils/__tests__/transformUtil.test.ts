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

import { calculateTransform } from "../transformUtil";

describe("transformUtil", () => {
  describe("calculateTransform", () => {
    it("should return translate when both positions are center", () => {
      expect(calculateTransform("center", "center")).toBe("translate(-50%, -50%)");
    });

    it("should return none when posX is not center", () => {
      expect(calculateTransform("left", "center")).toBe("none");
      expect(calculateTransform("right", "center")).toBe("none");
      expect(calculateTransform(100, "center")).toBe("none");
    });

    it("should return none when posY is not center", () => {
      expect(calculateTransform("center", "top")).toBe("none");
      expect(calculateTransform("center", "bottom")).toBe("none");
      expect(calculateTransform("center", 50)).toBe("none");
    });

    it("should return none when both positions are not center", () => {
      expect(calculateTransform("left", "top")).toBe("none");
      expect(calculateTransform(0, 0)).toBe("none");
    });
  });
});

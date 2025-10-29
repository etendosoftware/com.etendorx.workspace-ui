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

import { rgbaToHex } from "../colorUtil";

describe("colorUtil", () => {
  describe("rgbaToHex", () => {
    it("should return hex color when input is already hex", () => {
      expect(rgbaToHex("#ff5733")).toBe("#FF5733");
      expect(rgbaToHex("#abc")).toBe("#ABC");
    });

    it("should convert rgba to hex without alpha", () => {
      expect(rgbaToHex("rgba(255, 87, 51, 1)")).toBe("#FF5733");
      expect(rgbaToHex("rgba(0, 0, 0, 1)")).toBe("#000000");
      expect(rgbaToHex("rgba(255, 255, 255, 1)")).toBe("#FFFFFF");
    });

    it("should convert rgba to hex with alpha", () => {
      expect(rgbaToHex("rgba(255, 87, 51, 0.5)")).toBe("#FF573380");
      expect(rgbaToHex("rgba(0, 0, 0, 0)")).toBe("#00000000");
      expect(rgbaToHex("rgba(255, 255, 255, 0.75)")).toBe("#FFFFFFBF");
    });

    it("should handle rgb without alpha parameter", () => {
      expect(rgbaToHex("rgb(255, 87, 51)")).toBe("#FF5733");
      expect(rgbaToHex("rgb(100, 150, 200)")).toBe("#6496C8");
    });

    it("should handle single digit alpha values", () => {
      expect(rgbaToHex("rgba(255, 87, 51, 0.02)")).toBe("#FF573305");
    });
  });
});

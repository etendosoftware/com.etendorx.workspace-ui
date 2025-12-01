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

import { rgbaToHex } from "../../src/utils/colorUtil";

describe("colorUtil", () => {
  describe("rgbaToHex", () => {
    describe("Hex color input", () => {
      it("should return hex color unchanged and uppercase", () => {
        expect(rgbaToHex("#ff0000")).toBe("#FF0000");
      });

      it("should convert lowercase hex to uppercase", () => {
        expect(rgbaToHex("#abc123")).toBe("#ABC123");
      });

      it("should handle short hex format", () => {
        expect(rgbaToHex("#fff")).toBe("#FFF");
      });

      it("should handle hex with alpha channel", () => {
        expect(rgbaToHex("#ff0000ff")).toBe("#FF0000FF");
      });
    });

    describe("RGB color input", () => {
      it("should convert rgb(255, 0, 0) to #FF0000", () => {
        expect(rgbaToHex("rgb(255, 0, 0)")).toBe("#FF0000");
      });

      it("should convert rgb(0, 255, 0) to #00FF00", () => {
        expect(rgbaToHex("rgb(0, 255, 0)")).toBe("#00FF00");
      });

      it("should convert rgb(0, 0, 255) to #0000FF", () => {
        expect(rgbaToHex("rgb(0, 0, 255)")).toBe("#0000FF");
      });

      it("should convert rgb(255, 255, 255) to #FFFFFF", () => {
        expect(rgbaToHex("rgb(255, 255, 255)")).toBe("#FFFFFF");
      });

      it("should convert rgb(0, 0, 0) to #000000", () => {
        expect(rgbaToHex("rgb(0, 0, 0)")).toBe("#000000");
      });

      it("should handle rgb with extra spaces", () => {
        expect(rgbaToHex("rgb( 128 , 64 , 32 )")).toBe("#804020");
      });
    });

    describe("RGBA color input with full opacity", () => {
      it("should convert rgba(255, 0, 0, 1) to #FF0000", () => {
        expect(rgbaToHex("rgba(255, 0, 0, 1)")).toBe("#FF0000");
      });

      it("should convert rgba(0, 255, 0, 1.0) to #00FF00", () => {
        expect(rgbaToHex("rgba(0, 255, 0, 1.0)")).toBe("#00FF00");
      });

      it("should omit alpha when it is 1", () => {
        const result = rgbaToHex("rgba(100, 150, 200, 1)");
        expect(result).toBe("#6496C8");
        expect(result.length).toBe(7); // No alpha channel
      });
    });

    describe("RGBA color input with transparency", () => {
      it("should convert rgba(255, 0, 0, 0.5) to hex with alpha", () => {
        expect(rgbaToHex("rgba(255, 0, 0, 0.5)")).toBe("#FF000080");
      });

      it("should convert rgba(0, 0, 0, 0) to #00000000", () => {
        expect(rgbaToHex("rgba(0, 0, 0, 0)")).toBe("#00000000");
      });

      it("should convert rgba(255, 255, 255, 0.25) to hex with alpha", () => {
        expect(rgbaToHex("rgba(255, 255, 255, 0.25)")).toBe("#FFFFFF40");
      });

      it("should convert rgba(100, 150, 200, 0.75) to hex with alpha", () => {
        expect(rgbaToHex("rgba(100, 150, 200, 0.75)")).toBe("#6496C8BF");
      });

      it("should handle alpha = 0.1", () => {
        const result = rgbaToHex("rgba(255, 0, 0, 0.1)");
        expect(result).toBe("#FF00001A");
      });

      it("should handle alpha = 0.9", () => {
        const result = rgbaToHex("rgba(255, 0, 0, 0.9)");
        expect(result).toBe("#FF0000E6");
      });

      it("should pad single digit alpha with zero", () => {
        // Alpha 0.02 = 5.1 rounded to 5 = 0x05
        const result = rgbaToHex("rgba(255, 255, 255, 0.02)");
        expect(result.length).toBe(9);
        expect(result).toBe("#FFFFFF05");
      });
    });

    describe("Edge cases", () => {
      it("should handle rgb with minimum values", () => {
        expect(rgbaToHex("rgb(0, 0, 0)")).toBe("#000000");
      });

      it("should handle rgb with maximum values", () => {
        expect(rgbaToHex("rgb(255, 255, 255)")).toBe("#FFFFFF");
      });

      it("should handle rgba with no alpha parameter", () => {
        expect(rgbaToHex("rgba(128, 128, 128)")).toBe("#808080");
      });

      it("should handle mid-range values", () => {
        expect(rgbaToHex("rgb(128, 64, 192)")).toBe("#8040C0");
      });

      it("should handle single digit values correctly", () => {
        expect(rgbaToHex("rgb(1, 2, 3)")).toBe("#010203");
      });
    });

    describe("Color conversion accuracy", () => {
      it("should convert common color red", () => {
        expect(rgbaToHex("rgb(255, 0, 0)")).toBe("#FF0000");
      });

      it("should convert common color green", () => {
        expect(rgbaToHex("rgb(0, 128, 0)")).toBe("#008000");
      });

      it("should convert common color blue", () => {
        expect(rgbaToHex("rgb(0, 0, 255)")).toBe("#0000FF");
      });

      it("should convert common color yellow", () => {
        expect(rgbaToHex("rgb(255, 255, 0)")).toBe("#FFFF00");
      });

      it("should convert common color cyan", () => {
        expect(rgbaToHex("rgb(0, 255, 255)")).toBe("#00FFFF");
      });

      it("should convert common color magenta", () => {
        expect(rgbaToHex("rgb(255, 0, 255)")).toBe("#FF00FF");
      });

      it("should convert gray", () => {
        expect(rgbaToHex("rgb(128, 128, 128)")).toBe("#808080");
      });
    });

    describe("Alpha channel precision", () => {
      it("should round alpha 0.502 to 0x80", () => {
        // 0.502 * 255 = 128.01 rounds to 128 = 0x80
        expect(rgbaToHex("rgba(255, 0, 0, 0.502)")).toBe("#FF000080");
      });

      it("should handle alpha with many decimal places", () => {
        const result = rgbaToHex("rgba(255, 0, 0, 0.33333)");
        expect(result).toMatch(/^#FF0000[0-9A-F]{2}$/);
      });

      it("should convert alpha 0.5 to 80 in hex", () => {
        // 0.5 * 255 = 127.5 rounds to 128 = 0x80
        expect(rgbaToHex("rgba(100, 100, 100, 0.5)")).toBe("#64646480");
      });
    });

    describe("Format variations", () => {
      it("should handle rgba format without spaces after commas", () => {
        expect(rgbaToHex("rgba(255,0,0,0.5)")).toBe("#FF000080");
      });

      it("should handle rgb format without spaces", () => {
        expect(rgbaToHex("rgb(255,128,64)")).toBe("#FF8040");
      });

      it("should handle mixed spacing", () => {
        expect(rgbaToHex("rgba(255, 128,64 , 0.75)")).toBe("#FF8040BF");
      });
    });

    describe("Return value format", () => {
      it("should always return uppercase hex", () => {
        const result = rgbaToHex("rgb(171, 205, 239)");
        expect(result).toBe(result.toUpperCase());
      });

      it("should return 7 characters for opaque colors (including #)", () => {
        expect(rgbaToHex("rgb(255, 0, 0)").length).toBe(7);
      });

      it("should return 9 characters for transparent colors (including #)", () => {
        expect(rgbaToHex("rgba(255, 0, 0, 0.5)").length).toBe(9);
      });

      it("should always start with #", () => {
        expect(rgbaToHex("rgb(255, 0, 0)")).toMatch(/^#/);
        expect(rgbaToHex("rgba(255, 0, 0, 0.5)")).toMatch(/^#/);
      });
    });
  });
});

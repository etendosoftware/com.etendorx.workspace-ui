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

import { calculateTop, calculateLeft } from "../caltulatePositions";
import { Position } from "../../components/enums";

describe("caltulatePositions", () => {
  describe("calculateTop", () => {
    it("should return 50% for Center position", () => {
      expect(calculateTop(Position.Center)).toBe("50%");
    });

    it("should return 65% for Bottom position", () => {
      expect(calculateTop(Position.Bottom)).toBe("65%");
    });

    it("should return 5% for Top position", () => {
      expect(calculateTop(Position.Top)).toBe("5%");
    });

    it("should return numeric value as-is", () => {
      expect(calculateTop(100)).toBe(100);
      expect(calculateTop(0)).toBe(0);
    });

    it("should return custom string value as-is", () => {
      expect(calculateTop("75%")).toBe("75%");
      expect(calculateTop("200px")).toBe("200px");
    });
  });

  describe("calculateLeft", () => {
    it("should return 50% for Center position", () => {
      expect(calculateLeft(Position.Center)).toBe("50%");
    });

    it("should return 5% for Left position", () => {
      expect(calculateLeft(Position.Left)).toBe("5%");
    });

    it("should return 75% for Right position", () => {
      expect(calculateLeft(Position.Right)).toBe("75%");
    });

    it("should return numeric value as-is", () => {
      expect(calculateLeft(100)).toBe(100);
      expect(calculateLeft(0)).toBe(0);
    });

    it("should return custom string value as-is", () => {
      expect(calculateLeft("75%")).toBe("75%");
      expect(calculateLeft("200px")).toBe("200px");
    });
  });
});

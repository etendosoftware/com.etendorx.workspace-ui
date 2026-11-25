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

import {
  getCharacteristicLines,
  getCharacteristicsKey,
  isProductCharacteristicsValue,
} from "../productCharacteristics";

const CHARACTERISTICS = { Envase: "Botella / Vidrio", Formato: "330 ml" };

describe("productCharacteristics", () => {
  it("recognizes the form initialization value with characteristics", () => {
    expect(isProductCharacteristicsValue({ dbValue: "Envase: Vidrio", characteristics: CHARACTERISTICS })).toBe(true);
    expect(isProductCharacteristicsValue("Envase: Vidrio")).toBe(false);
    expect(isProductCharacteristicsValue(null)).toBe(false);
    expect(isProductCharacteristicsValue({ dbValue: "x", characteristics: null })).toBe(false);
  });

  it("keeps the characteristics under a side key of the field", () => {
    expect(getCharacteristicsKey("characteristicDescription")).toBe("characteristicDescription$_characteristics");
  });

  it("returns one line per characteristic in the server order", () => {
    expect(getCharacteristicLines(CHARACTERISTICS)).toEqual([
      { name: "Envase", value: "Botella / Vidrio" },
      { name: "Formato", value: "330 ml" },
    ]);
    expect(getCharacteristicLines({ Envase: null })).toEqual([{ name: "Envase", value: "" }]);
  });

  it("returns no lines without characteristics", () => {
    expect(getCharacteristicLines(undefined)).toEqual([]);
    expect(getCharacteristicLines("text")).toEqual([]);
  });
});

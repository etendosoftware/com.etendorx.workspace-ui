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

describe("rgbaToHex", () => {
  it.each([
    ["#ff5733", "#FF5733"],
    ["#abc", "#ABC"],
  ])("returns hex as-is: %s → %s", (input, expected) => {
    expect(rgbaToHex(input)).toBe(expected);
  });

  it.each([
    ["rgba(255, 87, 51, 1)", "#FF5733"],
    ["rgba(0, 0, 0, 1)", "#000000"],
    ["rgba(255, 255, 255, 1)", "#FFFFFF"],
    ["rgb(255, 87, 51)", "#FF5733"],
    ["rgb(100, 150, 200)", "#6496C8"],
  ])("converts rgba/rgb to hex: %s → %s", (input, expected) => {
    expect(rgbaToHex(input)).toBe(expected);
  });

  it.each([
    ["rgba(255, 87, 51, 0.5)", "#FF573380"],
    ["rgba(0, 0, 0, 0)", "#00000000"],
    ["rgba(255, 255, 255, 0.75)", "#FFFFFFBF"],
    ["rgba(255, 87, 51, 0.02)", "#FF573305"],
  ])("converts rgba with alpha: %s → %s", (input, expected) => {
    expect(rgbaToHex(input)).toBe(expected);
  });
});

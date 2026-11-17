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

import { isSameNumericValue } from "../numericValue";

describe("isSameNumericValue", () => {
  it.each([
    [5, 5],
    ["5", 5],
    ["5.00", 5],
    ["2.64", 2.64],
    [0, 0],
    ["0", 0],
    [-3.5, -3.5],
  ])("sees %p and %p as the same number", (current, next) => {
    expect(isSameNumericValue(current, next)).toBe(true);
  });

  it.each([
    [5, 6],
    ["5", 5.5],
    [0, 1],
    [-3.5, 3.5],
  ])("sees %p and %p as different numbers", (current, next) => {
    expect(isSameNumericValue(current, next)).toBe(false);
  });

  it.each([null, undefined, "", "   "])("treats %p as empty: the same as no number", (current) => {
    expect(isSameNumericValue(current, null)).toBe(true);
    expect(isSameNumericValue(current, 0)).toBe(false);
  });

  it("does not see an empty entry as the number that the form holds", () => {
    expect(isSameNumericValue(5, null)).toBe(false);
    expect(isSameNumericValue(0, null)).toBe(false);
  });

  it("does not take a value that is not a number for the same number", () => {
    expect(isSameNumericValue("abc", 0)).toBe(false);
    expect(isSameNumericValue(Number.NaN, 0)).toBe(false);
  });
});

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

import { JSToOBMasked } from "../number";

const STANDARD_MASK = "#,##0.00";

describe("JSToOBMasked", () => {
  it("formats with en defaults (decimal '.', grouping ',')", () => {
    expect(JSToOBMasked(1234.5, STANDARD_MASK, ".", ",", 3)).toBe("1,234.50");
  });

  it("formats with es defaults (decimal ',', grouping '.')", () => {
    expect(JSToOBMasked(1234.5, STANDARD_MASK, ",", ".", 3)).toBe("1.234,50");
  });

  it("groups millions", () => {
    expect(JSToOBMasked(1000000, STANDARD_MASK, ".", ",", 3)).toBe("1,000,000.00");
  });

  it("preserves the negative sign", () => {
    expect(JSToOBMasked(-1234.5, STANDARD_MASK, ".", ",", 3)).toBe("-1,234.50");
  });

  it("rounds to the mask's decimals", () => {
    expect(JSToOBMasked(1234.567, STANDARD_MASK, ".", ",", 3)).toBe("1,234.57");
  });

  it("trims optional ('#') decimals down to the minimum", () => {
    expect(JSToOBMasked(1234.5, "#,##0.##", ".", ",", 3)).toBe("1,234.5");
  });

  it("supports integer-only masks", () => {
    expect(JSToOBMasked(1234.6, "#,##0", ".", ",", 3)).toBe("1,235");
  });

  it("omits grouping when the interval is zero", () => {
    expect(JSToOBMasked(1234.5, STANDARD_MASK, ".", ",", 0)).toBe("1234.50");
  });

  it("returns non-numeric input unchanged", () => {
    expect(JSToOBMasked("not-a-number", STANDARD_MASK, ".", ",", 3)).toBe("not-a-number");
  });

  it("returns NaN unchanged (not finite)", () => {
    expect(JSToOBMasked(Number.NaN, STANDARD_MASK, ".", ",", 3)).toBeNaN();
  });
});

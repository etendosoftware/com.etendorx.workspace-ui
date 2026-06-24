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

import { createFormat, DEFAULT_GROUPING_SIZE, DEFAULT_NUMERIC_MASK } from "../format";

describe("createFormat", () => {
  it("derives en_US separators (decimal '.', grouping ',')", () => {
    const format = createFormat("en_US");
    expect(format.defaultDecimalSymbol).toBe(".");
    expect(format.defaultGroupingSymbol).toBe(",");
  });

  it("derives es_ES separators (decimal ',', grouping '.')", () => {
    const format = createFormat("es_ES");
    expect(format.defaultDecimalSymbol).toBe(",");
    expect(format.defaultGroupingSymbol).toBe(".");
  });

  it("exposes the standard grouping size and numeric mask", () => {
    const format = createFormat("en_US");
    expect(format.defaultGroupingSize).toBe(DEFAULT_GROUPING_SIZE);
    expect(format.defaultNumericMask).toBe(DEFAULT_NUMERIC_MASK);
  });

  it("falls back to en-US defaults when no language is given", () => {
    const format = createFormat(null);
    expect(format.defaultDecimalSymbol).toBe(".");
    expect(format.defaultGroupingSymbol).toBe(",");
  });
});

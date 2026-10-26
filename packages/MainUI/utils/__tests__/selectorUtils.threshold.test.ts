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

import { getMinCharsHint, isBelowSearchThreshold, isSearchSelectorDatasource } from "../selectorUtils";

describe("isBelowSearchThreshold", () => {
  it("is true while the term is shorter than the minimum", () => {
    expect(isBelowSearchThreshold("a", 3)).toBe(true);
    expect(isBelowSearchThreshold("ab", 3)).toBe(true);
  });

  it("is false once the minimum is reached", () => {
    expect(isBelowSearchThreshold("abc", 3)).toBe(false);
    expect(isBelowSearchThreshold("abcd", 3)).toBe(false);
  });

  it("counts the trimmed term, so spaces do not reach the minimum", () => {
    expect(isBelowSearchThreshold("  a ", 3)).toBe(true);
    expect(isBelowSearchThreshold("   ", 3)).toBe(false);
  });

  it("treats an empty term as the default list, not as below the minimum", () => {
    expect(isBelowSearchThreshold("", 3)).toBe(false);
  });

  it("never applies when there is no minimum", () => {
    expect(isBelowSearchThreshold("a")).toBe(false);
    expect(isBelowSearchThreshold("a", 0)).toBe(false);
  });
});

describe("isSearchSelectorDatasource", () => {
  it("is true for a selector with its own datasource", () => {
    expect(isSearchSelectorDatasource("BusinessPartnerSelector")).toBe(true);
    expect(isSearchSelectorDatasource("F8DD408F2F3A414188668836F84C21AF")).toBe(true);
  });

  it("is false for TableDir combos, reference lists and a missing datasource", () => {
    expect(isSearchSelectorDatasource("ComboTableDatasourceService")).toBe(false);
    expect(isSearchSelectorDatasource("ADList")).toBe(false);
    expect(isSearchSelectorDatasource("")).toBe(false);
    expect(isSearchSelectorDatasource(undefined)).toBe(false);
  });
});

describe("getMinCharsHint", () => {
  const t = () => "Type at least {{min}} characters to search";

  it("fills in the minimum", () => {
    expect(getMinCharsHint(t, 3)).toBe("Type at least 3 characters to search");
  });

  it("is empty when there is no minimum", () => {
    expect(getMinCharsHint(t, 0)).toBe("");
    expect(getMinCharsHint(t)).toBe("");
  });
});

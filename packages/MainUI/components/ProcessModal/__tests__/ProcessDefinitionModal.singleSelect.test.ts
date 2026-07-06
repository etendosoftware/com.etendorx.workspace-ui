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

/**
 * CT-AD-2: Single-record P&E enforcement.
 *
 * When isMultiRecord=false, selecting a 2nd row must deselect the 1st.
 * The clamp is implemented in WindowReferenceGrid.handleRowSelection via
 * the exported `clampToSingleRecord` pure function.
 */

import { clampToSingleRecord } from "../WindowReferenceGrid";

describe("clampToSingleRecord (CT-AD-2)", () => {
  it("returns the same object when 0 rows are selected", () => {
    const next = {};
    expect(clampToSingleRecord(next, {})).toBe(next);
  });

  it("returns the same object when exactly 1 row is selected", () => {
    const next = { r1: true };
    expect(clampToSingleRecord(next, {})).toBe(next);
  });

  it("keeps the newly-toggled row when a 2nd row is selected", () => {
    // prev had r1 selected, user toggles r2 ON
    const prev = { r1: true };
    const next = { r1: true, r2: true };
    const result = clampToSingleRecord(next, prev);
    expect(result).toEqual({ r2: true });
  });

  it("keeps the newly-toggled row when toggling a 3rd row", () => {
    const prev = { r1: true, r2: true };
    const next = { r1: true, r2: true, r3: true };
    const result = clampToSingleRecord(next, prev);
    expect(result).toEqual({ r3: true });
  });

  it("falls back to the last selected id when all ids were already in prev", () => {
    // Edge case: all candidates are already in prev — keep the last one
    const prev = { r1: true, r2: true };
    const next = { r1: true, r2: true };
    const result = clampToSingleRecord(next, prev);
    expect(result).toEqual({ r2: true });
  });

  it("ignores rows explicitly set to false when finding the newly-toggled id", () => {
    const prev = { r1: true };
    const next = { r1: true, r2: true, r3: false };
    const result = clampToSingleRecord(next, prev);
    expect(result).toEqual({ r2: true });
  });

  it("returns a different object reference when clamping occurs (enables persistentRef clear)", () => {
    const prev = { r1: true };
    const next = { r1: true, r2: true };
    const result = clampToSingleRecord(next, prev);
    expect(result).not.toBe(next);
  });
});

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

import { mergeDefinedValues } from "../mergeLiveValues";

describe("mergeDefinedValues", () => {
  it("overrides base values with the defined live values", () => {
    expect(mergeDefinedValues({ hasRegion: true, name: "Spain" }, { hasRegion: false })).toEqual({
      hasRegion: false,
      name: "Spain",
    });
  });

  it("skips undefined live values so they don't shadow the base", () => {
    expect(mergeDefinedValues({ hasRegion: false }, { hasRegion: undefined })).toEqual({ hasRegion: false });
  });

  it("keeps null and empty live values as real values", () => {
    expect(mergeDefinedValues({ a: "x", b: "y" }, { a: null, b: "" })).toEqual({ a: null, b: "" });
  });

  it.each([
    [undefined, undefined, {}],
    [null, { a: 1 }, { a: 1 }],
    [{ a: 1 }, null, { a: 1 }],
  ])("handles missing base or overrides (%p, %p)", (base, overrides, expected) => {
    expect(mergeDefinedValues(base, overrides)).toEqual(expected);
  });
});

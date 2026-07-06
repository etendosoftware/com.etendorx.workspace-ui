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

import { generateRandomString } from "../utilities";

describe("generateRandomString", () => {
  it("returns a string of the requested length", () => {
    expect(generateRandomString(12)).toHaveLength(12);
  });

  it("uses only letters by default (no digits, no specials)", () => {
    expect(generateRandomString(200)).toMatch(/^[a-zA-Z]+$/);
  });

  it("returns only digits when only digits are allowed", () => {
    expect(generateRandomString(50, false, false, true, false)).toMatch(/^\d+$/);
  });

  it("returns an empty string when no character pool is enabled", () => {
    expect(generateRandomString(10, false, false, false, false)).toBe("");
  });

  it("defaults invalid lengths to a single character", () => {
    expect(generateRandomString(0)).toHaveLength(1);
  });
});

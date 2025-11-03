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

import { ensureString } from "../ensureString";

describe("ensureString", () => {
  it("should return string as-is", () => {
    expect(ensureString("hello")).toBe("hello");
    expect(ensureString("")).toBe("");
  });

  it("should convert number to string", () => {
    expect(ensureString(123)).toBe("123");
    expect(ensureString(0)).toBe("0");
    expect(ensureString(-456)).toBe("-456");
    expect(ensureString(3.14)).toBe("3.14");
  });

  it("should convert boolean to string", () => {
    expect(ensureString(true)).toBe("true");
    expect(ensureString(false)).toBe("false");
  });

  it("should return empty string for null", () => {
    expect(ensureString(null)).toBe("");
  });

  it("should return empty string for undefined", () => {
    expect(ensureString(undefined)).toBe("");
  });

  it("should return empty string for objects", () => {
    expect(ensureString({})).toBe("");
    expect(ensureString({ key: "value" })).toBe("");
  });

  it("should return empty string for arrays", () => {
    expect(ensureString([])).toBe("");
    expect(ensureString([1, 2, 3])).toBe("");
  });
});

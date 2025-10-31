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

import className from "../className";

describe("className", () => {
  it("should combine multiple class names", () => {
    expect(className("class1", "class2", "class3")).toBe("class1 class2 class3");
  });

  it("should handle single class name", () => {
    expect(className("single")).toBe("single");
  });

  it("should handle empty strings", () => {
    expect(className("class1", "", "class2")).toBe("class1  class2");
  });

  it("should handle null values", () => {
    expect(className("class1", null, "class2")).toBe("class1 class2");
  });

  it("should handle undefined values", () => {
    expect(className("class1", undefined, "class2")).toBe("class1 class2");
  });

  it("should handle all null/undefined values", () => {
    expect(className(null, undefined, null)).toBe("");
  });

  it("should handle mixed valid and invalid values", () => {
    expect(className("valid", null, "another", undefined, "last")).toBe("valid another last");
  });

  it("should return empty string for no arguments", () => {
    expect(className()).toBe("");
  });

  it("should preserve spaces in individual class names", () => {
    expect(className("  class1  ", "  class2  ")).toBe("class1     class2");
  });
});

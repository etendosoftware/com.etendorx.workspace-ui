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

import { cleanDefaultClasses } from "../classUtil";

describe("cleanDefaultClasses", () => {
  it.each([
    ["text-blue-500 bg-white", undefined, "text-blue-500 bg-white"],
    ["text-blue-500 bg-white", "", "text-blue-500 bg-white"],
    ["text-blue-500 bg-white", "   ", "text-blue-500 bg-white"],
  ])("returns defaults when user classes empty: %s + %s = %s", (defaults, user, expected) => {
    expect(cleanDefaultClasses(defaults, user)).toBe(expected);
  });

  it.each([
    ["text-blue-500 bg-white", "text-red-500", "bg-white text-red-500", "text override"],
    ["text-blue-500 bg-white", "bg-black", "text-blue-500 bg-black", "bg override"],
    ["w-full h-screen", "w-1/2", "h-screen w-1/2", "width override"],
    ["w-full h-screen", "h-96", "w-full h-96", "height override"],
    ["rounded-lg bg-white", "rounded-full", "bg-white rounded-full", "rounded override"],
    ["text-blue-500 hover:text-blue-700", "hover:text-red-700", "text-blue-500 hover:text-red-700", "variant prefix"],
  ])("handles single overrides: %s", (defaults, user, expected) => {
    expect(cleanDefaultClasses(defaults, user)).toBe(expected);
  });

  it("overrides multiple classes", () => {
    expect(cleanDefaultClasses("text-blue-500 bg-white w-full", "text-red-500 bg-black")).toBe(
      "w-full text-red-500 bg-black"
    );
  });

  it("preserves non-tracked utilities", () => {
    expect(cleanDefaultClasses("text-blue-500 flex items-center", "text-red-500")).toBe(
      "flex items-center text-red-500"
    );
  });

  it("does not override text with arbitrary values", () => {
    expect(cleanDefaultClasses("text-blue-500", "text-[#custom]")).toBe("text-blue-500 text-[#custom]");
  });

  it("handles complex multi-override scenarios", () => {
    expect(
      cleanDefaultClasses("text-sm text-gray-700 bg-white rounded-md w-full h-10", "text-lg bg-blue-500 rounded-full")
    ).toBe("w-full h-10 text-lg bg-blue-500 rounded-full");
  });
});

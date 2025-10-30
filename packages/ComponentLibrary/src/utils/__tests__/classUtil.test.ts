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

describe("classUtil", () => {
  describe("cleanDefaultClasses", () => {
    it("should return default classes when no user classes provided", () => {
      expect(cleanDefaultClasses("text-blue-500 bg-white")).toBe("text-blue-500 bg-white");
    });

    it("should return default classes when user classes is empty string", () => {
      expect(cleanDefaultClasses("text-blue-500 bg-white", "")).toBe("text-blue-500 bg-white");
    });

    it("should return default classes when user classes is whitespace", () => {
      expect(cleanDefaultClasses("text-blue-500 bg-white", "   ")).toBe("text-blue-500 bg-white");
    });

    it("should override default text color with user text color", () => {
      const result = cleanDefaultClasses("text-blue-500 bg-white", "text-red-500");
      expect(result).toBe("bg-white text-red-500");
    });

    it("should override default background with user background", () => {
      const result = cleanDefaultClasses("text-blue-500 bg-white", "bg-black");
      expect(result).toBe("text-blue-500 bg-black");
    });

    it("should override multiple default classes with user classes", () => {
      const result = cleanDefaultClasses("text-blue-500 bg-white w-full", "text-red-500 bg-black");
      expect(result).toBe("w-full text-red-500 bg-black");
    });

    it("should handle width classes", () => {
      const result = cleanDefaultClasses("w-full h-screen", "w-1/2");
      expect(result).toBe("h-screen w-1/2");
    });

    it("should handle height classes", () => {
      const result = cleanDefaultClasses("w-full h-screen", "h-96");
      expect(result).toBe("w-full h-96");
    });

    it("should handle rounded classes", () => {
      const result = cleanDefaultClasses("rounded-lg bg-white", "rounded-full");
      expect(result).toBe("bg-white rounded-full");
    });

    it("should handle variant prefixes like hover:", () => {
      const result = cleanDefaultClasses("text-blue-500 hover:text-blue-700", "hover:text-red-700");
      expect(result).toBe("text-blue-500 hover:text-red-700");
    });

    it("should preserve classes that don't match tracked utilities", () => {
      const result = cleanDefaultClasses("text-blue-500 flex items-center", "text-red-500");
      expect(result).toBe("flex items-center text-red-500");
    });

    it("should not override text classes with arbitrary values", () => {
      const result = cleanDefaultClasses("text-blue-500", "text-[#custom]");
      expect(result).toBe("text-blue-500 text-[#custom]");
    });

    it("should handle multiple user classes with variants", () => {
      const result = cleanDefaultClasses("text-blue-500 bg-white hover:bg-gray-100", "text-red-500 hover:bg-red-100");
      expect(result).toBe("bg-white text-red-500 hover:bg-red-100");
    });

    it("should handle complex scenarios with multiple overrides", () => {
      const result = cleanDefaultClasses(
        "text-sm text-gray-700 bg-white rounded-md w-full h-10",
        "text-lg bg-blue-500 rounded-full"
      );
      expect(result).toBe("w-full h-10 text-lg bg-blue-500 rounded-full");
    });
  });
});

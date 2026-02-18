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

import { getEnvVar, getLinkedLabelOpenMode, isLinkedLabelOpenInForm } from "../prefs";

describe("prefs", () => {
  // ============================================================================
  // Environment Variables Backup
  // ============================================================================

  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Reset window.localStorage mock
    Object.defineProperty(global, "window", {
      value: {
        localStorage: {
          getItem: jest.fn(),
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  // ============================================================================
  // getEnvVar Tests
  // ============================================================================

  describe("getEnvVar", () => {
    it("should return environment variable value when set", () => {
      process.env.TEST_VAR = "test_value";
      expect(getEnvVar("TEST_VAR")).toBe("test_value");
    });

    it("should return undefined for non-existent variable", () => {
      delete process.env.NON_EXISTENT_VAR;
      expect(getEnvVar("NON_EXISTENT_VAR")).toBeUndefined();
    });

    it("should return undefined when process is not defined", () => {
      const originalProcess = global.process;
      // @ts-expect-error - Testing undefined process
      global.process = undefined;

      // Need to reimport to test with undefined process
      const result = getEnvVar("ANY_VAR");

      global.process = originalProcess;
      expect(result).toBeUndefined();
    });
  });

  // ============================================================================
  // getLinkedLabelOpenMode Tests
  // ============================================================================

  describe("getLinkedLabelOpenMode", () => {
    describe("environment variable priority", () => {
      it.each([
        { env: "form", expected: "form" },
        { env: "table", expected: "table" },
        { env: "FORM", expected: "form" },
        { env: "TABLE", expected: "table" },
        { env: "Form", expected: "form" },
      ])("should return '$expected' when env is '$env'", ({ env, expected }) => {
        process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE = env;
        expect(getLinkedLabelOpenMode()).toBe(expected);
      });

      it("should check LINKED_LABEL_OPEN_MODE when NEXT_PUBLIC variant is not set", () => {
        delete process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE;
        process.env.LINKED_LABEL_OPEN_MODE = "table";
        expect(getLinkedLabelOpenMode()).toBe("table");
      });

      it("should prioritize NEXT_PUBLIC over non-prefixed env var", () => {
        process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE = "form";
        process.env.LINKED_LABEL_OPEN_MODE = "table";
        expect(getLinkedLabelOpenMode()).toBe("form");
      });
    });

    describe("localStorage fallback", () => {
      beforeEach(() => {
        delete process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE;
        delete process.env.LINKED_LABEL_OPEN_MODE;
      });

      it.each([
        { stored: "form", expected: "form" },
        { stored: "table", expected: "table" },
        { stored: "FORM", expected: "form" },
        { stored: "TABLE", expected: "table" },
      ])("should return '$expected' from localStorage when '$stored' is stored", ({ stored, expected }) => {
        (window.localStorage.getItem as jest.Mock).mockReturnValue(stored);
        expect(getLinkedLabelOpenMode()).toBe(expected);
      });

      it("should return default 'form' when localStorage is empty", () => {
        (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
        expect(getLinkedLabelOpenMode()).toBe("form");
      });
    });

    describe("invalid values", () => {
      it.each([{ value: "invalid" }, { value: "" }, { value: "grid" }, { value: "123" }])(
        "should return default 'form' for invalid env value '$value'",
        ({ value }) => {
          process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE = value;
          expect(getLinkedLabelOpenMode()).toBe("form");
        }
      );

      it("should return default 'form' for invalid localStorage value", () => {
        delete process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE;
        delete process.env.LINKED_LABEL_OPEN_MODE;
        (window.localStorage.getItem as jest.Mock).mockReturnValue("invalid");
        expect(getLinkedLabelOpenMode()).toBe("form");
      });
    });

    describe("error handling", () => {
      it("should return default 'form' when window is undefined", () => {
        delete process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE;
        delete process.env.LINKED_LABEL_OPEN_MODE;
        // @ts-expect-error - Testing undefined window
        global.window = undefined;

        expect(getLinkedLabelOpenMode()).toBe("form");
      });

      it("should return default 'form' when localStorage throws", () => {
        delete process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE;
        delete process.env.LINKED_LABEL_OPEN_MODE;
        (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
          throw new Error("Storage error");
        });

        expect(getLinkedLabelOpenMode()).toBe("form");
      });
    });
  });

  // ============================================================================
  // isLinkedLabelOpenInForm Tests
  // ============================================================================

  describe("isLinkedLabelOpenInForm", () => {
    it("should return true when mode is 'form'", () => {
      process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE = "form";
      expect(isLinkedLabelOpenInForm()).toBe(true);
    });

    it("should return false when mode is 'table'", () => {
      process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE = "table";
      expect(isLinkedLabelOpenInForm()).toBe(false);
    });

    it("should return true by default", () => {
      delete process.env.NEXT_PUBLIC_LINKED_LABEL_OPEN_MODE;
      delete process.env.LINKED_LABEL_OPEN_MODE;
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      expect(isLinkedLabelOpenInForm()).toBe(true);
    });
  });
});

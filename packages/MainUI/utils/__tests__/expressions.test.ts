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
 * All portions are Copyright © 2024–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { createEvaluationContext } from "../expressions";
import * as propertyStore from "../propertyStore";

jest.mock("../propertyStore", () => ({
  getStoredPreferences: jest.fn(),
}));

describe("expressions - createEvaluationContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic value access", () => {
    it("should provide exact match access", () => {
      const context = createEvaluationContext({
        values: { name: "John" },
      });
      expect(context.name).toBe("John");
    });

    it("should normalize booleans by default", () => {
      const context = createEvaluationContext({
        values: { isTrue: true, isFalse: false },
      });
      expect(context.isTrue).toBe("Y");
      expect(context.isFalse).toBe("N");
    });

    it("should NOT normalize booleans if normalizeValues is false", () => {
      const context = createEvaluationContext({
        values: { isTrue: true },
        normalizeValues: false,
      });
      expect(context.isTrue).toBe(true);
    });

    it("should provide case-insensitive access", () => {
      const context = createEvaluationContext({
        values: { UserName: "test" },
      });
      expect(context.username).toBe("test");
      expect(context.USERNAME).toBe("test");
    });

    it("should provide loose match access (ignoring underscores)", () => {
      const context = createEvaluationContext({
        values: { c_bpartner_id: "123" },
      });
      expect(context.cbpartnerid).toBe("123");
    });

    it("should overwrite existing keys in fuzzy match", () => {
      const context = createEvaluationContext({
        context: { cbpartnerid: "old" },
        values: { c_bpartner_id: "new" },
      });
      // In the loop, cbpartnerid should be updated to 'new'
      expect(context.cbpartnerid).toBe("new");
    });
  });

  describe("Context hierarchy", () => {
    it("should prioritize values over parentValues", () => {
      const context = createEvaluationContext({
        values: { id: "child" },
        parentValues: { id: "parent" },
      });
      expect(context.id).toBe("child");
    });

    it("should prioritize values over context", () => {
      const context = createEvaluationContext({
        values: { id: "child" },
        context: { id: "global" },
      });
      expect(context.id).toBe("child");
    });
  });

  describe("Metadata Mapping", () => {
    it("should map HQL names to DB column names", () => {
      const context = createEvaluationContext({
        values: { cBpartner: "BP1" },
        fields: {
          field1: {
            hqlName: "cBpartner",
            column: { dBColumnName: "C_BPARTNER_ID" },
          } as any,
        },
      });
      expect(context.C_BPARTNER_ID).toBe("BP1");
      expect(context.c_bpartner_id).toBe("BP1");
    });

    it("should use field.columnName as fallback for DB column", () => {
      const context = createEvaluationContext({
        values: { cBpartner: "BP1" },
        fields: {
          field1: {
            hqlName: "cBpartner",
            columnName: "C_BPARTNER_ID",
          } as any,
        },
      });
      expect(context.C_BPARTNER_ID).toBe("BP1");
    });
  });

  describe("Special Access Patterns", () => {
    it("should handle @property@ access", () => {
      const context = createEvaluationContext({
        values: { name: "John" },
      });
      // @ts-ignore
      expect(context["@name@"]).toBe("John");
    });

    it("should handle # and $ prefixes for preferences", () => {
      (propertyStore.getStoredPreferences as jest.Mock).mockReturnValue({
        MyPref: "Value",
      });

      const context = createEvaluationContext({});
      expect(context["#MyPref"]).toBe("Value");
      expect(context["$MyPref"]).toBe("Value");
    });

    it("should handle case-insensitive preference lookup", () => {
      (propertyStore.getStoredPreferences as jest.Mock).mockReturnValue({
        MyPref: "Value",
      });

      const context = createEvaluationContext({});
      expect(context["#mypref"]).toBe("Value");
    });

    it("should return undefined if preference not found", () => {
      (propertyStore.getStoredPreferences as jest.Mock).mockReturnValue({});
      const context = createEvaluationContext({});
      expect(context["#Missing"]).toBeUndefined();
    });
  });

  describe("Fallbacks", () => {
    it("should return defaultValue if provided and property not found", () => {
      const context = createEvaluationContext({
        defaultValue: "DefaultValue",
      });
      expect(context.nonexistent).toBe("DefaultValue");
    });

    it("should return undefined if property not found and no defaultValue", () => {
      const context = createEvaluationContext({});
      expect(context.nonexistent).toBeUndefined();
    });
  });

  describe("Snake Case Generation", () => {
    it("should auto-generate snake case keys for camelCase values", () => {
      const context = createEvaluationContext({
        values: { userName: "John" },
      });
      expect(context.USER_NAME).toBe("John");
    });
  });

  describe("Proxy 'has' trap", () => {
    it("should return true for existing property", () => {
      const context = createEvaluationContext({
        values: { name: "John" },
      });
      expect("name" in context).toBe(true);
    });

    it("should return true for case-insensitive existing property", () => {
      const context = createEvaluationContext({
        values: { Name: "John" },
      });
      expect("name" in context).toBe(true);
    });

    it("should return false for non-existing property", () => {
      const context = createEvaluationContext({});
      expect("name" in context).toBe(false);
    });

    it("should handle non-string property access", () => {
      const context = createEvaluationContext({});
      const sym = Symbol("test");
      // @ts-ignore
      expect(context[sym]).toBeUndefined();
    });

    it("should handle non-string property check in 'has' trap", () => {
      const context = createEvaluationContext({});
      const sym = Symbol("test");
      expect(sym in context).toBe(false);
    });
  });
});

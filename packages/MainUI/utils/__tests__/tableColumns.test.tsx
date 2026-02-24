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

import { parseColumns } from "../tableColumns";
import type { Field } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@/utils", () => ({
  getFieldReference: jest.fn((ref: string) => {
    const refMap: Record<string, string> = {
      "20": "BOOLEAN",
      "17": "LIST",
      "19": "TABLEDIR",
      "10": "STRING",
    };
    return refMap[ref] || "STRING";
  }),
}));

jest.mock("@/utils/color/utils", () => ({
  isColorString: jest.fn((color: string) => /^#[0-9a-f]{6}$/i.test(color)),
  getContrastTextColor: jest.fn(() => "#ffffff"),
}));

describe("tableColumns", () => {
  // ============================================================================
  // Test Data Factories
  // ============================================================================

  const createField = (overrides: Partial<Field> = {}): Field =>
    ({
      id: "field-1",
      name: "testField",
      hqlName: "testField",
      columnName: "test_field",
      isMandatory: false,
      showInGridView: true,
      displayed: true,
      shownInStatusBar: false,
      column: {
        reference: "10",
        reference$_identifier: "String",
      },
      ...overrides,
    }) as Field;

  const createFields = (configs: Partial<Field>[]): Field[] => configs.map(createField);

  // ============================================================================
  // parseColumns Tests
  // ============================================================================

  describe("parseColumns", () => {
    describe("basic parsing", () => {
      it("should return empty array when columns is undefined", () => {
        expect(parseColumns()).toEqual([]);
      });

      it("should return empty array when columns is empty array", () => {
        expect(parseColumns([])).toEqual([]);
      });

      it("should parse a single column correctly", () => {
        const fields = createFields([{ name: "testColumn", hqlName: "testColumn" }]);
        const result = parseColumns(fields);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("testColumn");
        expect(result[0].name).toBe("testColumn");
        expect(result[0].columnName).toBe("testColumn");
      });

      it("should parse multiple columns", () => {
        const fields = createFields([
          { name: "column1", hqlName: "column1" },
          { name: "column2", hqlName: "column2" },
          { name: "column3", hqlName: "column3" },
        ]);
        const result = parseColumns(fields);

        expect(result).toHaveLength(3);
        expect(result.map((c) => c.name)).toEqual(["column1", "column2", "column3"]);
      });
    });

    describe("column properties mapping", () => {
      it("should map header from name or fallback to hqlName", () => {
        const fields = createFields([
          { name: "Named Column", hqlName: "namedColumn" },
          { name: undefined, hqlName: "hqlOnlyColumn" } as unknown as Partial<Field>,
        ]);
        const result = parseColumns(fields);

        expect(result[0].header).toBe("Named Column");
        expect(result[1].header).toBe("hqlOnlyColumn");
      });

      it("should map mandatory field correctly", () => {
        const fields = createFields([
          { name: "required", isMandatory: true },
          { name: "optional", isMandatory: false },
        ]);
        const result = parseColumns(fields);

        expect(result[0].isMandatory).toBe(true);
        expect(result[1].isMandatory).toBe(false);
      });

      it("should set enableHiding to true for all columns", () => {
        const fields = createFields([{ name: "col1" }, { name: "col2" }]);
        const result = parseColumns(fields);

        expect(result.every((c) => c.enableHiding === true)).toBe(true);
      });

      it("should map showInGridView correctly", () => {
        const fields = createFields([
          { name: "visible", showInGridView: true },
          { name: "hidden", showInGridView: false },
        ]);
        const result = parseColumns(fields);

        expect(result[0].showInGridView).toBe(true);
        expect(result[1].showInGridView).toBe(false);
      });
    });

    describe("reference handling", () => {
      it("should include refList for SELECT/LIST fields", () => {
        const refList = [
          { value: "A", label: "Active" },
          { value: "I", label: "Inactive" },
        ];
        const fields = createFields([
          {
            name: "status",
            column: { reference: "17" },
            refList,
          },
        ]);
        const result = parseColumns(fields);

        expect(result[0].refList).toEqual(refList);
      });

      it("should include referencedEntity for TABLEDIR fields", () => {
        const fields = createFields([
          {
            name: "organization",
            column: { reference: "19" },
            referencedEntity: "Organization",
          },
        ]);
        const result = parseColumns(fields);

        expect(result[0].referencedEntity).toBe("Organization");
      });

      it("should include referencedWindowId", () => {
        const fields = createFields([
          {
            name: "partner",
            referencedWindowId: "window-123",
          },
        ]);
        const result = parseColumns(fields);

        expect(result[0].referencedWindowId).toBe("window-123");
      });

      it("should include referencedTabId", () => {
        const fields = createFields([
          {
            name: "tab",
            referencedTabId: "tab-456",
          },
        ]);
        const result = parseColumns(fields);

        expect(result[0].referencedTabId).toBe("tab-456");
      });
    });

    describe("selector and datasource handling", () => {
      it("should map selectorDefinitionId from selector.id", () => {
        const fields = createFields([
          {
            name: "selector",
            selector: { id: "selector-123" },
          } as Partial<Field>,
        ]);
        const result = parseColumns(fields);

        expect(result[0].selectorDefinitionId).toBe("selector-123");
      });

      it("should prefer targetEntity over referencedEntity for datasourceId", () => {
        const fields = createFields([
          {
            name: "entity",
            targetEntity: "TargetEntity",
            referencedEntity: "ReferencedEntity",
          } as Partial<Field>,
        ]);
        const result = parseColumns(fields);

        expect(result[0].datasourceId).toBe("TargetEntity");
      });

      it("should fallback to referencedEntity for datasourceId", () => {
        const fields = createFields([
          {
            name: "entity",
            referencedEntity: "ReferencedEntity",
          },
        ]);
        const result = parseColumns(fields);

        expect(result[0].datasourceId).toBe("ReferencedEntity");
      });
    });

    describe("inline editing properties", () => {
      it("should include isReadOnly", () => {
        const fields = createFields([
          { name: "readonly", isReadOnly: true },
          { name: "editable", isReadOnly: false },
        ]);
        const result = parseColumns(fields);

        expect(result[0].isReadOnly).toBe(true);
        expect(result[1].isReadOnly).toBe(false);
      });

      it("should include isUpdatable", () => {
        const fields = createFields([
          { name: "updatable", isUpdatable: true },
          { name: "fixed", isUpdatable: false },
        ]);
        const result = parseColumns(fields);

        expect(result[0].isUpdatable).toBe(true);
        expect(result[1].isUpdatable).toBe(false);
      });

      it("should include readOnlyLogicExpression", () => {
        const expression = "@IsSOTrx@='Y'";
        const fields = createFields([
          {
            name: "conditional",
            readOnlyLogicExpression: expression,
          },
        ]);
        const result = parseColumns(fields);

        expect(result[0].readOnlyLogicExpression).toBe(expression);
        expect(result[0].column?.readOnlyLogicExpression).toBe(expression);
      });
    });

    describe("customJs handling", () => {
      it("should map etmetaCustomjs to customJs", () => {
        const customJs = "function() { return 'custom'; }";
        const fields = createFields([
          {
            name: "custom",
            etmetaCustomjs: customJs,
          } as Partial<Field>,
        ]);
        const result = parseColumns(fields);

        expect(result[0].customJs).toBe(customJs);
      });
    });

    describe("accessorFn", () => {
      it("should have accessorFn defined for each column", () => {
        const fields = createFields([{ name: "col1" }, { name: "col2" }]);
        const result = parseColumns(fields);

        expect(result.every((c) => typeof c.accessorFn === "function")).toBe(true);
      });

      it("should return raw value for string fields", () => {
        const fields = createFields([
          {
            name: "textField",
            hqlName: "textField",
            column: { reference: "10" },
          },
        ]);
        const result = parseColumns(fields);

        const testData = { textField: "Hello World" };
        expect(result[0].accessorFn?.(testData)).toBe("Hello World");
      });

      it("should use identifier value when available", () => {
        const fields = createFields([
          {
            name: "refField",
            hqlName: "refField",
            column: { reference: "10" },
          },
        ]);
        const result = parseColumns(fields);

        const testData = {
          refField: "123",
          refField$_identifier: "Referenced Name",
        };
        expect(result[0].accessorFn?.(testData)).toBe("Referenced Name");
      });

      it("should fallback to columnName value", () => {
        const fields = createFields([
          {
            name: "field",
            hqlName: "fieldHql",
            columnName: "field_column",
            column: { reference: "10" },
          },
        ]);
        const result = parseColumns(fields);

        const testData = { field_column: "Column Value" };
        expect(result[0].accessorFn?.(testData)).toBe("Column Value");
      });
    });

    describe("error handling", () => {
      it("should handle malformed column data gracefully", () => {
        // Should not throw
        expect(() => parseColumns([{} as Field])).not.toThrow();
      });
    });
  });
});

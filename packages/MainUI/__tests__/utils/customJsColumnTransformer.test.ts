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

import { transformColumnsWithCustomJs } from "@/utils/customJsColumnTransformer";
import type { Column, Field } from "@workspaceui/api-client/src/api/types";

// Mock the CustomJsCell component
jest.mock("@/components/Table/CustomJsCell", () => ({
  CustomJsCell: () => null,
}));

describe("transformColumnsWithCustomJs", () => {
  const mockColumns: Column[] = [
    {
      id: "name",
      header: "Name",
      name: "name",
      accessorFn: (row: Record<string, unknown>) => row.name,
      columnName: "name",
      _identifier: "name",
      fieldId: "name-field-id", // Add fieldId to match with field
    },
    {
      id: "amount",
      header: "Amount",
      name: "amount",
      accessorFn: (row: Record<string, unknown>) => row.amount,
      columnName: "amount",
      _identifier: "amount",
      fieldId: "amount-field-id", // Add fieldId to match with field
    },
  ];

  const mockFields: Field[] = [
    {
      id: "name-field-id",
      name: "name",
      showInGridView: true,
      etmetaCustomjs: null,
    } as Field,
    {
      id: "amount-field-id",
      name: "amount",
      showInGridView: true,
      etmetaCustomjs: "(record) => record.amount * 1.21",
    } as Field,
  ];

  it("should transform columns with custom JS", () => {
    const result = transformColumnsWithCustomJs(mockColumns, mockFields);

    expect(result).toHaveLength(2);

    // First column should remain unchanged (no custom JS)
    expect(result[0]).toEqual(mockColumns[0]);

    // Second column should have custom Cell component
    expect(result[1]).toHaveProperty("Cell");
    expect(result[1].id).toBe("amount");
    expect(result[1].header).toBe("Amount");
    expect(result[1].name).toBe("amount");
  });

  it("should skip columns without custom JS", () => {
    const fieldsWithoutCustomJs: Field[] = [
      { id: "name-field-id", name: "name", showInGridView: true, etmetaCustomjs: null } as Field,
      { id: "amount-field-id", name: "amount", showInGridView: true, etmetaCustomjs: "" } as Field,
    ];

    const result = transformColumnsWithCustomJs(mockColumns, fieldsWithoutCustomJs);

    expect(result).toEqual(mockColumns);
  });

  it("should handle empty custom JS strings", () => {
    const fieldsWithEmptyJs: Field[] = [
      { id: "name-field-id", name: "name", showInGridView: true, etmetaCustomjs: "   " } as Field, // whitespace only
      { id: "amount-field-id", name: "amount", showInGridView: true, etmetaCustomjs: "" } as Field,
    ];

    const result = transformColumnsWithCustomJs(mockColumns, fieldsWithEmptyJs);

    expect(result).toEqual(mockColumns);
  });

  it("should handle fields that do not match any column", () => {
    const fieldsWithUnmatchedField: Field[] = [
      { id: "name-field-id", name: "name", showInGridView: true, etmetaCustomjs: null } as Field,
      {
        id: "nonexistent-field-id",
        name: "nonexistent",
        showInGridView: true,
        etmetaCustomjs: '(record) => "test"',
      } as Field,
    ];

    const result = transformColumnsWithCustomJs(mockColumns, fieldsWithUnmatchedField);

    // Should return original columns unchanged since no matching field was found
    expect(result).toEqual(mockColumns);
  });

  it("should preserve original column properties when adding custom JS", () => {
    const result = transformColumnsWithCustomJs(mockColumns, mockFields);
    const transformedColumn = result[1]; // amount column with custom JS

    // All original properties should be preserved
    expect(transformedColumn.id).toBe(mockColumns[1].id);
    expect(transformedColumn.header).toBe(mockColumns[1].header);
    expect(transformedColumn.name).toBe(mockColumns[1].name);
    expect(transformedColumn.accessorFn).toBe(mockColumns[1].accessorFn);
    expect(transformedColumn.columnName).toBe(mockColumns[1].columnName);
    expect(transformedColumn._identifier).toBe(mockColumns[1]._identifier);

    // Plus the new Cell component
    expect(transformedColumn).toHaveProperty("Cell");
  });

  it("should handle multiple columns with custom JS", () => {
    const multipleCustomJsFields: Field[] = [
      {
        id: "name-field-id",
        name: "name",
        showInGridView: true,
        etmetaCustomjs: "(record) => record.name.toUpperCase()",
      } as Field,
      {
        id: "amount-field-id",
        name: "amount",
        showInGridView: true,
        etmetaCustomjs: "(record) => record.amount * 1.21",
      } as Field,
    ];

    const result = transformColumnsWithCustomJs(mockColumns, multipleCustomJsFields);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("Cell"); // name column now has custom JS
    expect(result[1]).toHaveProperty("Cell"); // amount column has custom JS
  });
});

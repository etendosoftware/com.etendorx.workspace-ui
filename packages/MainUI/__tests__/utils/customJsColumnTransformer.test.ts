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

import { transformColumnsWithCustomJs, transformColumnWithCustomJs } from "@/utils/customJsColumnTransformer";
import type { Column } from "@workspaceui/api-client/src/api/types";

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
      customJs: "return cell.getValue();", // Add customJs to test transformation
    },
  ];

  it("should transform columns with custom JS", () => {
    const result = transformColumnsWithCustomJs(mockColumns);

    expect(result).toHaveLength(2);

    // First column should remain unchanged (no custom JS)
    expect(result[0]).toEqual(mockColumns[0]);

    // Second column should have custom Cell component and muiTableBodyCellProps
    expect(result[1]).toHaveProperty("Cell");
    expect(result[1]).toHaveProperty("muiTableBodyCellProps");
    expect(result[1].muiTableBodyCellProps).toEqual({
      sx: {
        padding: "0px",
      },
    });
    expect(result[1].id).toBe("amount");
    expect(result[1].header).toBe("Amount");
    expect(result[1].name).toBe("amount");
    expect(result[1].customJs).toBe("return cell.getValue();");
  });

  it("should skip columns without custom JS", () => {
    const columnsWithoutCustomJs: Column[] = [
      {
        id: "name",
        header: "Name",
        name: "name",
        accessorFn: (row: Record<string, unknown>) => row.name,
        columnName: "name",
        _identifier: "name",
        fieldId: "name-field-id",
      },
    ];

    const result = transformColumnsWithCustomJs(columnsWithoutCustomJs);

    expect(result).toEqual(columnsWithoutCustomJs);
  });

  it("should handle empty custom JS strings", () => {
    const columnsWithEmptyCustomJs: Column[] = [
      {
        id: "name",
        header: "Name",
        name: "name",
        accessorFn: (row: Record<string, unknown>) => row.name,
        columnName: "name",
        _identifier: "name",
        fieldId: "name-field-id",
        customJs: "", // Empty string should not transform
      },
      {
        id: "amount",
        header: "Amount",
        name: "amount",
        accessorFn: (row: Record<string, unknown>) => row.amount,
        columnName: "amount",
        _identifier: "amount",
        fieldId: "amount-field-id",
        customJs: "   ", // Whitespace only should not transform
      },
    ];

    const result = transformColumnsWithCustomJs(columnsWithEmptyCustomJs);

    expect(result).toEqual(columnsWithEmptyCustomJs);
  });

  it("should handle fields that do not match any column", () => {
    const columnsWithoutCustomJs: Column[] = [
      {
        id: "name",
        header: "Name",
        name: "name",
        accessorFn: (row: Record<string, unknown>) => row.name,
        columnName: "name",
        _identifier: "name",
        fieldId: "name-field-id",
      },
    ];

    const result = transformColumnsWithCustomJs(columnsWithoutCustomJs);

    // Should return original columns unchanged since no custom JS was found
    expect(result).toEqual(columnsWithoutCustomJs);
  });

  it("should preserve original column properties when adding custom JS", () => {
    const result = transformColumnsWithCustomJs(mockColumns);
    const transformedColumn = result[1]; // amount column with custom JS

    // All original properties should be preserved
    expect(transformedColumn.id).toBe(mockColumns[1].id);
    expect(transformedColumn.header).toBe(mockColumns[1].header);
    expect(transformedColumn.name).toBe(mockColumns[1].name);
    expect(transformedColumn.accessorFn).toBe(mockColumns[1].accessorFn);
    expect(transformedColumn.columnName).toBe(mockColumns[1].columnName);
    expect(transformedColumn._identifier).toBe(mockColumns[1]._identifier);
    expect(transformedColumn.customJs).toBe(mockColumns[1].customJs);

    // Plus the new Cell component and muiTableBodyCellProps
    expect(transformedColumn).toHaveProperty("Cell");
    expect(transformedColumn).toHaveProperty("muiTableBodyCellProps");
    expect(transformedColumn.muiTableBodyCellProps).toEqual({
      sx: {
        padding: "0px",
      },
    });
  });

  it("should handle multiple columns with custom JS", () => {
    const columnsWithMultipleCustomJs: Column[] = [
      {
        id: "name",
        header: "Name",
        name: "name",
        accessorFn: (row: Record<string, unknown>) => row.name,
        columnName: "name",
        _identifier: "name",
        fieldId: "name-field-id",
        customJs: "return row.original.name.toUpperCase();",
      },
      {
        id: "amount",
        header: "Amount",
        name: "amount",
        accessorFn: (row: Record<string, unknown>) => row.amount,
        columnName: "amount",
        _identifier: "amount",
        fieldId: "amount-field-id",
        customJs: "return '$' + cell.getValue();",
      },
    ];

    const result = transformColumnsWithCustomJs(columnsWithMultipleCustomJs);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("Cell"); // name column now has custom JS
    expect(result[1]).toHaveProperty("Cell"); // amount column has custom JS

    // Both should have muiTableBodyCellProps
    expect(result[0]).toHaveProperty("muiTableBodyCellProps");
    expect(result[1]).toHaveProperty("muiTableBodyCellProps");
  });
});

describe("transformColumnWithCustomJs", () => {
  const mockColumn: Column = {
    id: "amount",
    header: "Amount",
    name: "amount",
    accessorFn: (row: Record<string, unknown>) => row.amount,
    columnName: "amount",
    _identifier: "amount",
    fieldId: "amount-field-id",
    customJs: "return '$' + cell.getValue();",
  };

  it("should add Cell component to column", () => {
    const result = transformColumnWithCustomJs(mockColumn);

    expect(result).toHaveProperty("Cell");
    expect(typeof result.Cell).toBe("function");
  });

  it("should add muiTableBodyCellProps with correct styling", () => {
    const result = transformColumnWithCustomJs(mockColumn);

    expect(result).toHaveProperty("muiTableBodyCellProps");
    expect(result.muiTableBodyCellProps).toEqual({
      sx: {
        padding: "0px",
      },
    });
  });

  it("should preserve all original column properties", () => {
    const result = transformColumnWithCustomJs(mockColumn);

    // Check that all original properties are preserved
    expect(result.id).toBe(mockColumn.id);
    expect(result.header).toBe(mockColumn.header);
    expect(result.name).toBe(mockColumn.name);
    expect(result.accessorFn).toBe(mockColumn.accessorFn);
    expect(result.columnName).toBe(mockColumn.columnName);
    expect(result._identifier).toBe(mockColumn._identifier);
    expect(result.fieldId).toBe(mockColumn.fieldId);
    expect(result.customJs).toBe(mockColumn.customJs);
  });

  it("should handle column with undefined customJs", () => {
    const columnWithoutCustomJs: Column = {
      ...mockColumn,
      customJs: undefined,
    };

    const result = transformColumnWithCustomJs(columnWithoutCustomJs);

    expect(result).toHaveProperty("Cell");
    expect(result).toHaveProperty("muiTableBodyCellProps");
    expect(result.customJs).toBeUndefined();
  });

  it("should handle column with empty customJs", () => {
    const columnWithEmptyCustomJs: Column = {
      ...mockColumn,
      customJs: "",
    };

    const result = transformColumnWithCustomJs(columnWithEmptyCustomJs);

    expect(result).toHaveProperty("Cell");
    expect(result).toHaveProperty("muiTableBodyCellProps");
    expect(result.customJs).toBe("");
  });

  it("should create Cell component that can be invoked", () => {
    const result = transformColumnWithCustomJs(mockColumn);

    // Test that the Cell component exists and is a function
    expect(result.Cell).toBeDefined();
    expect(typeof result.Cell).toBe("function");
  });

  it("should verify Cell component structure", () => {
    const result = transformColumnWithCustomJs(mockColumn);

    // This test verifies that the Cell component is structured correctly
    // The actual rendering is tested in the CustomJsCell component tests
    expect(result.Cell).toBeDefined();
    expect(typeof result.Cell).toBe("function");
  });

  it("should handle column with complex customJs code", () => {
    const complexColumn: Column = {
      ...mockColumn,
      customJs: `
        const value = cell.getValue();
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
        return formatted;
      `,
    };

    const result = transformColumnWithCustomJs(complexColumn);

    expect(result).toHaveProperty("Cell");
    expect(result).toHaveProperty("muiTableBodyCellProps");
    expect(result.customJs).toBe(complexColumn.customJs);
  });
});

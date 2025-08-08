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

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { CustomJsCell } from "@/components/Table/CustomJsCell";
import type { MRT_Cell, MRT_Row } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

// Mock the evaluateCustomJs function
jest.mock("@/utils/customJsEvaluator", () => ({
  evaluateCustomJs: jest.fn(),
}));

const mockEvaluateCustomJs = jest.mocked(require("@/utils/customJsEvaluator").evaluateCustomJs);

describe("CustomJsCell Component", () => {
  const mockEntityData: EntityData = {
    id: "1",
    name: "John Doe",
    amount: 1500,
  };

  // Mock MRT_Cell with only the properties we actually use
  const mockCell = {
    getValue: () => "original value",
    id: "test-cell",
    column: {
      id: "test",
      columnDef: {
        id: "test",
        accessorKey: "test",
      },
    },
  } as unknown as MRT_Cell<EntityData, unknown>;

  // Mock MRT_Row with only the properties we actually use
  const mockRow = {
    original: mockEntityData,
    id: "test-row",
    index: 0,
    getValue: (columnId: string) => mockEntityData[columnId as keyof EntityData],
  } as unknown as MRT_Row<EntityData>;

  const mockColumn = {
    id: "test",
    name: "test",
    header: "Test",
    accessorFn: (row: Record<string, unknown>) => row.test,
    columnName: "test",
    _identifier: "test",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render evaluated result", async () => {
    mockEvaluateCustomJs.mockResolvedValue("JOHN DOE");

    render(
      <CustomJsCell
        cell={mockCell}
        row={mockRow}
        customJsCode="(record) => record.name.toUpperCase()"
        column={mockColumn}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("JOHN DOE")).toBeInTheDocument();
    });

    expect(mockEvaluateCustomJs).toHaveBeenCalledWith("(record) => record.name.toUpperCase()", {
      record: mockRow.original,
      column: mockColumn,
    });
  });

  it("should show loading state during evaluation", () => {
    mockEvaluateCustomJs.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CustomJsCell cell={mockCell} row={mockRow} customJsCode="(record) => record.name" column={mockColumn} />);

    // The component should show a loading spinner during evaluation
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should fallback to original value on error", async () => {
    mockEvaluateCustomJs.mockRejectedValue(new Error("Evaluation failed"));

    render(
      <CustomJsCell
        cell={mockCell}
        row={mockRow}
        customJsCode="(record) => record.invalid.property"
        column={mockColumn}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("original value")).toBeInTheDocument();
    });
  });

  it("should handle JSX elements as result", async () => {
    const jsxElement = React.createElement("div", {}, "Custom JSX");
    mockEvaluateCustomJs.mockResolvedValue(jsxElement);

    render(
      <CustomJsCell
        cell={mockCell}
        row={mockRow}
        customJsCode="(record) => <div>Custom JSX</div>"
        column={mockColumn}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Custom JSX")).toBeInTheDocument();
    });
  });

  it("should handle number results", async () => {
    mockEvaluateCustomJs.mockResolvedValue(1815);

    render(
      <CustomJsCell cell={mockCell} row={mockRow} customJsCode="(record) => record.amount * 1.21" column={mockColumn} />
    );

    await waitFor(() => {
      expect(screen.getByText("1815")).toBeInTheDocument();
    });
  });

  it("should handle boolean results", async () => {
    mockEvaluateCustomJs.mockResolvedValue(true);

    render(
      <CustomJsCell cell={mockCell} row={mockRow} customJsCode="(record) => record.amount > 1000" column={mockColumn} />
    );

    await waitFor(() => {
      expect(screen.getByText("true")).toBeInTheDocument();
    });
  });

  it("should re-evaluate when dependencies change", async () => {
    mockEvaluateCustomJs.mockResolvedValue("Initial Value");

    const { rerender } = render(
      <CustomJsCell cell={mockCell} row={mockRow} customJsCode="(record) => record.name" column={mockColumn} />
    );

    await waitFor(() => {
      expect(screen.getByText("Initial Value")).toBeInTheDocument();
    });

    // Change the custom JS code
    mockEvaluateCustomJs.mockResolvedValue("Updated Value");

    rerender(
      <CustomJsCell
        cell={mockCell}
        row={mockRow}
        customJsCode="(record) => record.name + ' Updated'"
        column={mockColumn}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Updated Value")).toBeInTheDocument();
    });

    expect(mockEvaluateCustomJs).toHaveBeenCalledTimes(2);
  });
});

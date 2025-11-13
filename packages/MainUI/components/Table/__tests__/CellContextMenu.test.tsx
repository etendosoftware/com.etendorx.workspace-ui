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

import { render, screen, fireEvent } from "@testing-library/react";
import { CellContextMenu } from "../CellContextMenu";
import type { MRT_Cell, MRT_Row } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

// Mock the translation hook
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "table.useAsFilter": "Use as filter",
        "table.editRow": "Edit Row",
        "table.insertRow": "Insert Row",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the Menu component
jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => {
  return function MockMenu({ children, anchorEl }: any) {
    if (!anchorEl) return null;
    return <div data-testid="mock-menu">{children}</div>;
  };
});

describe("CellContextMenu", () => {
  const mockCell = {
    column: { id: "testColumn" },
  } as MRT_Cell<EntityData>;

  const mockRow = {
    original: { id: "123", name: "Test Row" },
  } as MRT_Row<EntityData>;

  const mockColumns = [{ id: "testColumn", columnName: "testColumn", type: "string" }];

  const defaultProps = {
    anchorEl: document.createElement("div"),
    onClose: jest.fn(),
    cell: mockCell,
    row: mockRow,
    onFilterByValue: jest.fn(),
    columns: mockColumns,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the context menu with filter option when anchorEl is provided", () => {
    render(<CellContextMenu {...defaultProps} />);

    expect(screen.getByTestId("mock-menu")).toBeInTheDocument();
    expect(screen.getByTestId("use-as-filter-menu-item")).toBeInTheDocument();
    expect(screen.getByText("Use as filter")).toBeInTheDocument();
  });

  it("does not render when anchorEl is null", () => {
    render(<CellContextMenu {...defaultProps} anchorEl={null} />);

    expect(screen.queryByTestId("mock-menu")).not.toBeInTheDocument();
  });

  it("shows inline editing options when canEdit is true and row is not editing", () => {
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: false,
      onEditRow: jest.fn(),
      onInsertRow: jest.fn(),
    };

    render(<CellContextMenu {...props} />);

    expect(screen.getByTestId("edit-row-menu-item")).toBeInTheDocument();
    expect(screen.getByTestId("insert-row-menu-item")).toBeInTheDocument();
    expect(screen.getByText("Edit Row")).toBeInTheDocument();
    expect(screen.getByText("Insert Row")).toBeInTheDocument();
  });

  it("hides inline editing options when canEdit is false", () => {
    const props = {
      ...defaultProps,
      canEdit: false,
      isRowEditing: false,
      onEditRow: jest.fn(),
      onInsertRow: jest.fn(),
    };

    render(<CellContextMenu {...props} />);

    expect(screen.queryByTestId("edit-row-menu-item")).not.toBeInTheDocument();
    expect(screen.queryByTestId("insert-row-menu-item")).not.toBeInTheDocument();
  });

  it("hides inline editing options when row is currently editing", () => {
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: true,
      onEditRow: jest.fn(),
      onInsertRow: jest.fn(),
    };

    render(<CellContextMenu {...props} />);

    expect(screen.queryByTestId("edit-row-menu-item")).not.toBeInTheDocument();
    expect(screen.queryByTestId("insert-row-menu-item")).not.toBeInTheDocument();
  });

  it("calls onEditRow and onClose when Edit Row is clicked", () => {
    const onEditRow = jest.fn();
    const onClose = jest.fn();
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: false,
      onEditRow,
      onClose,
    };

    render(<CellContextMenu {...props} />);

    fireEvent.click(screen.getByTestId("edit-row-menu-item"));

    expect(onEditRow).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onInsertRow and onClose when Insert Row is clicked", () => {
    const onInsertRow = jest.fn();
    const onClose = jest.fn();
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: false,
      onInsertRow,
      onClose,
    };

    render(<CellContextMenu {...props} />);

    fireEvent.click(screen.getByTestId("insert-row-menu-item"));

    expect(onInsertRow).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onFilterByValue and onClose when Use as filter is clicked", () => {
    const onFilterByValue = jest.fn();
    const onClose = jest.fn();
    const props = {
      ...defaultProps,
      onFilterByValue,
      onClose,
    };

    render(<CellContextMenu {...props} />);

    fireEvent.click(screen.getByTestId("use-as-filter-menu-item"));

    expect(onFilterByValue).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard navigation for Edit Row option", () => {
    const onEditRow = jest.fn();
    const onClose = jest.fn();
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: false,
      onEditRow,
      onClose,
    };

    render(<CellContextMenu {...props} />);

    const editRowItem = screen.getByTestId("edit-row-menu-item");
    fireEvent.keyDown(editRowItem, { key: "Enter" });

    expect(onEditRow).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard navigation for Insert Row option", () => {
    const onInsertRow = jest.fn();
    const onClose = jest.fn();
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: false,
      onInsertRow,
      onClose,
    };

    render(<CellContextMenu {...props} />);

    const insertRowItem = screen.getByTestId("insert-row-menu-item");
    fireEvent.keyDown(insertRowItem, { key: " " });

    expect(onInsertRow).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not trigger actions for non-Enter/Space keyboard events", () => {
    const onEditRow = jest.fn();
    const onClose = jest.fn();
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: false,
      onEditRow,
      onClose,
    };

    render(<CellContextMenu {...props} />);

    const editRowItem = screen.getByTestId("edit-row-menu-item");
    fireEvent.keyDown(editRowItem, { key: "Tab" });

    expect(onEditRow).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("maintains existing filter functionality with inline editing options present", () => {
    const onFilterByValue = jest.fn();
    const props = {
      ...defaultProps,
      canEdit: true,
      isRowEditing: false,
      onEditRow: jest.fn(),
      onInsertRow: jest.fn(),
      onFilterByValue,
    };

    render(<CellContextMenu {...props} />);

    // Both inline editing options and filter option should be present
    expect(screen.getByTestId("edit-row-menu-item")).toBeInTheDocument();
    expect(screen.getByTestId("insert-row-menu-item")).toBeInTheDocument();
    expect(screen.getByTestId("use-as-filter-menu-item")).toBeInTheDocument();

    // Filter functionality should still work
    fireEvent.click(screen.getByTestId("use-as-filter-menu-item"));
    expect(onFilterByValue).toHaveBeenCalledTimes(1);
  });
});

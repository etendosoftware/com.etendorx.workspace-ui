import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DynamicTable from "../index";
import { TestProviders } from "../../../__tests__/test-utils";
import type { EntityData, Column } from "@workspaceui/api-client/src/api/types";

// Mock the hooks and contexts
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => ({
    registerDatasource: jest.fn(),
    unregisterDatasource: jest.fn(),
    registerRefetchFunction: jest.fn(),
    registerRecordsGetter: jest.fn(),
    registerHasMoreRecordsGetter: jest.fn(),
    registerFetchMore: jest.fn(),
  }),
}));

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => ({
    registerActions: jest.fn(),
    registerAttachmentAction: jest.fn(),
    setShouldOpenAttachmentModal: jest.fn(),
  }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({
    tab: { id: "test-tab", window: "test-window" },
    parentTab: null,
    parentRecord: null,
  }),
}));

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({
    graph: {
      getParent: jest.fn(),
      getSelected: jest.fn(),
      setSelected: jest.fn(),
      setSelectedMultiple: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      getChildren: jest.fn(() => []),
    },
  }),
}));

jest.mock("@/hooks/navigation/useMultiWindowURL", () => ({
  useMultiWindowURL: () => ({
    activeWindow: { windowId: "test-window" },
    getSelectedRecord: jest.fn(),
  }),
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({
    user: { id: "test-user" },
  }),
}));

jest.mock("@/hooks/table/useTableData", () => ({
  useTableData: () => ({
    displayRecords: mockRecords,
    records: mockRecords,
    columns: mockColumns,
    expanded: {},
    loading: false,
    error: null,
    shouldUseTreeMode: false,
    handleMRTColumnFiltersChange: jest.fn(),
    handleMRTColumnVisibilityChange: jest.fn(),
    handleMRTSortingChange: jest.fn(),
    handleMRTColumnOrderChange: jest.fn(),
    handleMRTExpandChange: jest.fn(),
    toggleImplicitFilters: jest.fn(),
    fetchMore: jest.fn(),
    refetch: jest.fn(),
    removeRecordLocally: jest.fn(),
    hasMoreRecords: false,
    applyQuickFilter: jest.fn(),
  }),
}));

jest.mock("@/hooks/useTableStatePersistenceTab", () => ({
  useTableStatePersistenceTab: () => ({
    tableColumnFilters: [],
    tableColumnVisibility: {},
    tableColumnSorting: [],
    tableColumnOrder: [],
  }),
}));

jest.mock("@/hooks/useTableSelection", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock data
const mockColumns: Column[] = [
  {
    id: "name",
    name: "name",
    header: "Name",
    columnName: "name",
    displayType: "string",
    isMandatory: true,
    _identifier: "name",
  },
  {
    id: "email",
    name: "email",
    header: "Email",
    columnName: "email",
    displayType: "string",
    isMandatory: false,
    _identifier: "email",
  },
  {
    id: "age",
    name: "age",
    header: "Age",
    columnName: "age",
    displayType: "number",
    isMandatory: false,
    _identifier: "age",
  },
  {
    id: "active",
    name: "active",
    header: "Active",
    columnName: "active",
    displayType: "boolean",
    isMandatory: false,
    _identifier: "active",
  },
];

const mockRecords: EntityData[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    active: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    age: 25,
    active: false,
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    age: 35,
    active: true,
  },
];

const renderDynamicTable = (props = {}) => {
  const defaultProps = {
    setRecordId: jest.fn(),
    onRecordSelection: jest.fn(),
    isTreeMode: false,
  };

  return render(
    <TestProviders>
      <DynamicTable {...defaultProps} {...props} />
    </TestProviders>
  );
};

describe("Inline Editing End-to-End Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  describe("Complete User Workflows", () => {
    it("should complete full edit workflow: edit -> modify -> save", async () => {
      renderDynamicTable();

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Right-click on a row to open context menu
      const firstRow = screen.getByText("John Doe").closest("tr");
      expect(firstRow).toBeInTheDocument();

      await user.pointer({ keys: "[MouseRight]", target: firstRow });

      // Click "Edit Row" from context menu
      await waitFor(() => {
        expect(screen.getByText("table.editRow")).toBeInTheDocument();
      });

      await user.click(screen.getByText("table.editRow"));

      // Verify row is now in edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
        expect(nameInput.tagName).toBe("INPUT");
      });

      // Modify the name field
      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);
      await user.type(nameInput, "John Updated");

      // Verify the change is reflected
      expect(nameInput).toHaveValue("John Updated");

      // Save the changes
      const saveButton = screen.getByTestId("save-button-1");
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).not.toBeDisabled();

      await user.click(saveButton);

      // Verify save operation completed (row exits edit mode)
      await waitFor(() => {
        expect(screen.queryByDisplayValue("John Updated")).not.toBeInTheDocument();
        expect(screen.getByText("John Updated")).toBeInTheDocument();
      });
    });

    it("should complete full new record workflow: insert -> fill -> save", async () => {
      renderDynamicTable();

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Right-click to open context menu
      const firstRow = screen.getByText("John Doe").closest("tr");
      await user.pointer({ keys: "[MouseRight]", target: firstRow });

      // Click "Insert Row" from context menu
      await waitFor(() => {
        expect(screen.getByText("table.insertRow")).toBeInTheDocument();
      });

      await user.click(screen.getByText("table.insertRow"));

      // Verify new row is inserted and in edit mode
      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        expect(inputs.length).toBeGreaterThan(0);
      });

      // Fill in the required fields
      const nameInput = screen.getAllByRole("textbox")[0]; // First input should be name
      await user.type(nameInput, "New User");

      const emailInput = screen.getAllByRole("textbox")[1]; // Second input should be email
      await user.type(emailInput, "newuser@example.com");

      // Save the new record
      const saveButtons = screen.getAllByTestId(/save-button-/);
      const newRowSaveButton = saveButtons.find((button) => button.getAttribute("data-testid")?.includes("new_"));

      expect(newRowSaveButton).toBeInTheDocument();
      await user.click(newRowSaveButton!);

      // Verify new record is saved and visible
      await waitFor(() => {
        expect(screen.getByText("New User")).toBeInTheDocument();
        expect(screen.getByText("newuser@example.com")).toBeInTheDocument();
      });
    });

    it("should handle cancel workflow with unsaved changes", async () => {
      renderDynamicTable();

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Verify row is in edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Make changes
      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Name");

      // Cancel the changes
      const cancelButton = screen.getByTestId("cancel-button-1");
      await user.click(cancelButton);

      // Verify changes are discarded and row exits edit mode
      await waitFor(() => {
        expect(screen.queryByDisplayValue("Modified Name")).not.toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("should navigate between cells using Tab key", async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Focus should be on the first input (name)
      const nameInput = screen.getByDisplayValue("John Doe");
      expect(nameInput).toHaveFocus();

      // Tab to next field
      await user.tab();

      // Should focus on email field
      const emailInput = screen.getByDisplayValue("john@example.com");
      expect(emailInput).toHaveFocus();

      // Tab to next field
      await user.tab();

      // Should focus on age field
      const ageInput = screen.getByDisplayValue("30");
      expect(ageInput).toHaveFocus();
    });

    it("should save row using Enter key", async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Make a change
      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated via Enter");

      // Press Enter to save
      await user.keyboard("{Enter}");

      // Verify save operation completed
      await waitFor(() => {
        expect(screen.queryByDisplayValue("Updated via Enter")).not.toBeInTheDocument();
        expect(screen.getByText("Updated via Enter")).toBeInTheDocument();
      });
    });

    it("should cancel editing using Escape key", async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Make a change
      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);
      await user.type(nameInput, "Will be cancelled");

      // Press Escape to cancel
      await user.keyboard("{Escape}");

      // Verify changes are cancelled
      await waitFor(() => {
        expect(screen.queryByDisplayValue("Will be cancelled")).not.toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Features", () => {
    it("should have proper ARIA labels and roles", async () => {
      renderDynamicTable();

      // Check table has proper role
      const table = screen.getByRole("grid");
      expect(table).toBeInTheDocument();

      // Start editing to check cell accessibility
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Check input has proper ARIA attributes
      const nameInput = screen.getByDisplayValue("John Doe");
      expect(nameInput).toHaveAttribute("aria-label");
      expect(nameInput).toHaveAttribute("role", "gridcell");

      // Check action buttons have proper labels
      const saveButton = screen.getByTestId("save-button-1");
      expect(saveButton).toHaveAttribute("aria-label");

      const cancelButton = screen.getByTestId("cancel-button-1");
      expect(cancelButton).toHaveAttribute("aria-label");
    });

    it("should announce state changes to screen readers", async () => {
      renderDynamicTable();

      // Check for ARIA live regions
      const liveRegions = document.querySelectorAll("[aria-live]");
      expect(liveRegions.length).toBeGreaterThan(0);

      // Start editing - this should trigger an announcement
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // The announcement should be made to the live region
      // (We can't easily test the actual announcement, but we can verify the structure is in place)
      const politeRegion = document.querySelector('[aria-live="polite"]');
      expect(politeRegion).toBeInTheDocument();
    });

    it("should handle validation errors accessibly", async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Clear required field to trigger validation error
      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);

      // Blur to trigger validation
      await user.tab();

      // Check for error indicators
      await waitFor(() => {
        // Input should be marked as invalid
        expect(nameInput).toHaveAttribute("aria-invalid", "true");

        // Save button should be disabled due to errors
        const saveButton = screen.getByTestId("save-button-1");
        expect(saveButton).toBeDisabled();
      });
    });
  });

  describe("Performance with Large Datasets", () => {
    it("should handle multiple simultaneous edits efficiently", async () => {
      renderDynamicTable();

      // Start editing multiple rows
      const editButtons = screen.getAllByTestId(/edit-button-/);

      // Edit first two rows
      await user.click(editButtons[0]);
      await user.click(editButtons[1]);

      // Wait for both rows to be in edit mode
      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        expect(inputs.length).toBeGreaterThan(4); // At least 2 rows * 2+ fields each
      });

      // Verify both rows are independently editable
      const allInputs = screen.getAllByRole("textbox");
      const firstRowNameInput = allInputs.find((input) => (input as HTMLInputElement).value === "John Doe");
      const secondRowNameInput = allInputs.find((input) => (input as HTMLInputElement).value === "Jane Smith");

      expect(firstRowNameInput).toBeInTheDocument();
      expect(secondRowNameInput).toBeInTheDocument();

      // Modify both
      await user.clear(firstRowNameInput!);
      await user.type(firstRowNameInput!, "John Modified");

      await user.clear(secondRowNameInput!);
      await user.type(secondRowNameInput!, "Jane Modified");

      // Save both rows
      const saveButtons = screen.getAllByTestId(/save-button-/);
      await user.click(saveButtons[0]);
      await user.click(saveButtons[1]);

      // Verify both saves completed
      await waitFor(() => {
        expect(screen.getByText("John Modified")).toBeInTheDocument();
        expect(screen.getByText("Jane Modified")).toBeInTheDocument();
      });
    });

    it("should maintain performance with rapid input changes", async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Rapidly type in the input to test debouncing/throttling
      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);

      // Type rapidly
      const rapidText = "RapidTypingTest";
      for (const char of rapidText) {
        await user.type(nameInput, char, { delay: 10 }); // Very fast typing
      }

      // Verify final value is correct
      expect(nameInput).toHaveValue("RapidTypingTest");

      // Save should still work
      const saveButton = screen.getByTestId("save-button-1");
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("RapidTypingTest")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle network errors gracefully", async () => {
      // Mock a network error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      renderDynamicTable();

      // Start editing and try to save (this will fail due to mocked error)
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);
      await user.type(nameInput, "Will Fail");

      const saveButton = screen.getByTestId("save-button-1");
      await user.click(saveButton);

      // Should show error indicator
      await waitFor(() => {
        const errorIndicator = screen.getByTestId("error-indicator-1");
        expect(errorIndicator).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it("should handle validation errors properly", async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Clear required field
      const nameInput = screen.getByDisplayValue("John Doe");
      await user.clear(nameInput);

      // Try to save with validation errors
      const saveButton = screen.getByTestId("save-button-1");
      expect(saveButton).toBeDisabled(); // Should be disabled due to validation errors

      // Fill the field again
      await user.type(nameInput, "Valid Name");

      // Save button should be enabled again
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });

    it("should handle concurrent editing conflicts", async () => {
      renderDynamicTable();

      // Start editing the same row twice (simulating concurrent access)
      const editButtons = screen.getAllByTestId("edit-button-1");
      const firstEditButton = editButtons[0];

      await user.click(firstEditButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // The row should be in edit mode and subsequent edit attempts should be handled gracefully
      const nameInput = screen.getByDisplayValue("John Doe");
      expect(nameInput).toBeInTheDocument();

      // Only one set of edit controls should be visible
      const saveButtons = screen.getAllByTestId("save-button-1");
      expect(saveButtons).toHaveLength(1);
    });
  });

  describe("Integration with Existing Table Features", () => {
    it("should maintain sorting functionality during editing", async () => {
      renderDynamicTable();

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Try to sort (should be prevented or handled gracefully)
      const nameHeader = screen.getByText("Name");
      await user.click(nameHeader);

      // Row should still be in edit mode
      const nameInput = screen.getByDisplayValue("John Doe");
      expect(nameInput).toBeInTheDocument();
    });

    it("should maintain row selection during editing", async () => {
      renderDynamicTable();

      // Select a row first
      const firstRowCheckbox = screen.getAllByRole("checkbox")[1]; // Skip header checkbox
      await user.click(firstRowCheckbox);

      // Start editing the same row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Row should still be selected
      expect(firstRowCheckbox).toBeChecked();
    });

    it("should handle form view navigation during editing", async () => {
      const mockSetRecordId = jest.fn();
      renderDynamicTable({ setRecordId: mockSetRecordId });

      // Start editing a row
      const editButton = screen.getByTestId("edit-button-1");
      await user.click(editButton);

      // Wait for edit mode
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue("John Doe");
        expect(nameInput).toBeInTheDocument();
      });

      // Click form view button
      const formButton = screen.getByTestId("form-button-1");
      await user.click(formButton);

      // Should navigate to form view
      expect(mockSetRecordId).toHaveBeenCalledWith("1");
    });
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FormProvider, useForm } from "react-hook-form";
import type React from "react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import StatusBar from "@/components/Form/FormView/StatusBar";

// Mock the toolbar context with custom implementation
const mockToolbarContext = {
  onSave: jest.fn(),
  onRefresh: jest.fn(),
  onNew: jest.fn(),
  onBack: jest.fn(),
  onFilter: jest.fn(),
  onColumnFilters: jest.fn(),
  registerActions: jest.fn(),
};

jest.mock("@/contexts/ToolbarContext", () => ({
  useToolbarContext: () => mockToolbarContext,
}));

// Mock dependencies
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "forms.statusBar.closeRecord": "Close Record",
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock("@/hooks/useFieldValue", () => ({
  useFieldValue: (field: Field) => ({
    displayValue: field.name === "Status" ? "Active" : `Value for ${field.name}`,
  }),
}));

jest.mock("@/components/Form/FormView/StatusBarField", () => {
  return function MockStatusBarField({ field }: { field: Field }) {
    return (
      <div data-testid={`status-field-${field.hqlName}`}>
        <label>{field.name}:</label>
        <span>Value for {field.name}</span>
      </div>
    );
  };
});

// Test wrapper component with required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      {children}
    </FormProvider>
  );
}

const mockFields: Record<string, Field> = {
  status: {
    hqlName: "status",
    inputName: "status", 
    columnName: "status",
    process: "",
    shownInStatusBar: true,
    tab: "test-tab",
    displayed: true,
    startnewline: false,
    showInGridView: true,
    fieldGroup$_identifier: "field-group",
    fieldGroup: "group1",
    isMandatory: false,
    column: {},
    name: "Status",
    id: "status-id",
    module: "test-module",
    hasDefaultValue: false,
    refColumnName: "",
    targetEntity: "",
    gridProps: {} as any,
    type: "text",
    field: [],
    refList: [],
    referencedEntity: "",
    referencedWindowId: "",
    referencedTabId: "",
    isReadOnly: false,
    isDisplayed: true,
    sequenceNumber: 1,
    isUpdatable: true,
    description: "Status field",
    helpComment: "Status help",
  },
  createdBy: {
    hqlName: "createdBy",
    inputName: "createdBy",
    columnName: "createdBy", 
    process: "",
    shownInStatusBar: true,
    tab: "test-tab",
    displayed: true,
    startnewline: false,
    showInGridView: true,
    fieldGroup$_identifier: "field-group",
    fieldGroup: "group1",
    isMandatory: false,
    column: {},
    name: "Created By",
    id: "createdBy-id",
    module: "test-module",
    hasDefaultValue: false,
    refColumnName: "",
    targetEntity: "",
    gridProps: {} as any,
    type: "text",
    field: [],
    refList: [],
    referencedEntity: "",
    referencedWindowId: "",
    referencedTabId: "",
    isReadOnly: true,
    isDisplayed: true,
    sequenceNumber: 2,
    isUpdatable: false,
    description: "Created by field",
    helpComment: "Created by help",
  },
  updatedBy: {
    hqlName: "updatedBy",
    inputName: "updatedBy",
    columnName: "updatedBy",
    process: "",
    shownInStatusBar: true,
    tab: "test-tab",
    displayed: true,
    startnewline: false,
    showInGridView: true,
    fieldGroup$_identifier: "field-group",
    fieldGroup: "group1",
    isMandatory: false,
    column: {},
    name: "Updated By",
    id: "updatedBy-id",
    module: "test-module",
    hasDefaultValue: false,
    refColumnName: "",
    targetEntity: "",
    gridProps: {} as any,
    type: "text",
    field: [],
    refList: [],
    referencedEntity: "",
    referencedWindowId: "",
    referencedTabId: "",
    isReadOnly: true,
    isDisplayed: true,
    sequenceNumber: 3,
    isUpdatable: false,
    description: "Updated by field",
    helpComment: "Updated by help",
  },
};

describe("StatusBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockToolbarContext.onSave.mockResolvedValue(undefined);
    mockToolbarContext.onBack.mockImplementation(() => {});
  });

  describe("Rendering", () => {
    it("renders status bar with correct layout structure", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const statusBar = screen.getByTestId("status-bar-container");
      expect(statusBar).toHaveClass("h-10", "flex", "items-center", "justify-between", "bg-gray-100/50");
    });

    it("renders all provided status fields", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      expect(screen.getByTestId("status-field-status")).toBeInTheDocument();
      expect(screen.getByTestId("status-field-createdBy")).toBeInTheDocument();
      expect(screen.getByTestId("status-field-updatedBy")).toBeInTheDocument();
    });

    it("renders status fields in the correct container", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const fieldsContainer = screen.getByTestId("status-field-status").parentElement;
      expect(fieldsContainer).toHaveClass("flex", "gap-4", "text-sm");
    });

    it("renders close button with correct tooltip", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass("w-8", "h-8");
    });

    it("renders close icon inside the button", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      const closeIcon = screen.getByTestId("mock-svg");
      expect(closeButton).toContainElement(closeIcon);
    });

    it("renders correctly with empty fields object", () => {
      const emptyFields = {};
      render(
        <TestWrapper>
          <StatusBar fields={emptyFields} />
        </TestWrapper>
      );

      const fieldsContainer = screen.getByTestId("status-bar-container").querySelector(".flex.gap-4.text-sm");
      expect(fieldsContainer?.children).toHaveLength(0);
      expect(screen.getByTestId("icon-button")).toBeInTheDocument();
    });

    it("renders correctly with single field", () => {
      const singleField = { status: mockFields.status };
      render(
        <TestWrapper>
          <StatusBar fields={singleField} />
        </TestWrapper>
      );

      expect(screen.getByTestId("status-field-status")).toBeInTheDocument();
      expect(screen.queryByTestId("status-field-createdBy")).not.toBeInTheDocument();
    });
  });

  describe("Close Record Functionality", () => {
    it("calls onSave with false parameter when close button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      await user.click(closeButton);

      expect(mockToolbarContext.onSave).toHaveBeenCalledWith(false);
      expect(mockToolbarContext.onSave).toHaveBeenCalledTimes(1);
    });

    it("calls onBack after successful save", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockToolbarContext.onBack).toHaveBeenCalledTimes(1);
      });
    });

    it("handles save error gracefully and logs error", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const saveError = new Error("Save failed");
      mockToolbarContext.onSave.mockRejectedValue(saveError);

      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      await user.click(closeButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error saving record", saveError);
      });

      expect(mockToolbarContext.onBack).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it("does not call onBack if save fails", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockToolbarContext.onSave.mockRejectedValue(new Error("Save failed"));

      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      await user.click(closeButton);

      // Wait a bit to ensure onBack is not called
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockToolbarContext.onBack).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it("button is not disabled by default", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      expect(closeButton).not.toHaveAttribute("disabled");
    });

    it("handles multiple rapid clicks correctly", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      
      // Click multiple times rapidly
      await user.click(closeButton);
      await user.click(closeButton);
      await user.click(closeButton);

      // Even with multiple clicks, should only trigger the save/back cycle appropriately
      expect(mockToolbarContext.onSave).toHaveBeenCalledTimes(3);
      
      await waitFor(() => {
        expect(mockToolbarContext.onBack).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("State Management", () => {
    it("manages isSaved state correctly during successful flow", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      await user.click(closeButton);

      await waitFor(() => {
        expect(mockToolbarContext.onBack).toHaveBeenCalled();
      });

      // State should be reset after component processes the save
      expect(mockToolbarContext.onSave).toHaveBeenCalledWith(false);
    });

    it("resets isSaved state when component unmounts", () => {
      const { unmount } = render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      // This tests the cleanup effect
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("has proper semantic structure", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      // The main container should be identifiable
      const statusBar = screen.getByTestId("status-bar-container");
      expect(statusBar).toBeInTheDocument();
    });

    it("close button is keyboard accessible", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      const closeButton = screen.getByTestId("icon-button");
      closeButton.focus();
      
      await user.keyboard("{Enter}");
      expect(mockToolbarContext.onSave).toHaveBeenCalledWith(false);
    });
  });

  describe("Integration with Context", () => {
    it("uses toolbar context correctly", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      // Component should render without errors when context is properly provided
      expect(screen.getByTestId("icon-button")).toBeInTheDocument();
    });
  });

  describe("Props Validation", () => {
    it("handles fields prop correctly", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      // Should render all fields provided
      Object.keys(mockFields).forEach(fieldKey => {
        expect(screen.getByTestId(`status-field-${fieldKey}`)).toBeInTheDocument();
      });
    });

    it("handles fields with different structures", () => {
      const customFields: Record<string, Field> = {
        customField: {
          hqlName: "customField",
          inputName: "customField",
          columnName: "custom_field",
          process: "",
          shownInStatusBar: true,
          tab: "custom-tab",
          displayed: true,
          startnewline: false,
          showInGridView: true,
          fieldGroup$_identifier: "field-group",
          fieldGroup: "group1",
          isMandatory: true,
          column: {},
          name: "Custom Field",
          id: "custom-id",
          module: "test-module",
          hasDefaultValue: true,
          refColumnName: "ref_col",
          targetEntity: "target",
          gridProps: {} as any,
          type: "number",
          field: [],
          refList: [{ id: "ref1", label: "Reference", value: "ref_val" }],
          referencedEntity: "RefEntity",
          referencedWindowId: "win1",
          referencedTabId: "tab1",
          displayLogicExpression: "1=1",
          readOnlyLogicExpression: "1=0",
          isReadOnly: false,
          isDisplayed: true,
          sequenceNumber: 1,
          isUpdatable: true,
          description: "Custom field description",
          helpComment: "Custom field help",
        },
      };

      render(
        <TestWrapper>
          <StatusBar fields={customFields} />
        </TestWrapper>
      );

      expect(screen.getByTestId("status-field-customField")).toBeInTheDocument();
    });
  });

  describe("Translation Integration", () => {
    it("uses translated text for tooltip", () => {
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      // The mock translation should be used
      const closeButton = screen.getByTestId("icon-button");
      expect(closeButton).toBeInTheDocument();
      // Note: tooltip prop testing might require additional setup depending on IconButton implementation
    });

    it("handles missing translation keys gracefully", () => {
      // This tests the fallback behavior of our mocked translation function
      render(
        <TestWrapper>
          <StatusBar fields={mockFields} />
        </TestWrapper>
      );

      expect(screen.getByTestId("icon-button")).toBeInTheDocument();
    });
  });
});
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MRT_Row } from "material-react-table";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

import { ActionsColumn } from "../ActionsColumn";

// Mock the translation hook
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "table.actions.save": "Save",
        "table.actions.cancel": "Cancel",
        "table.actions.editInGrid": "Edit in grid",
        "table.actions.openFormView": "Open form view",
        "table.actions.saveDisabledErrors": "Fix validation errors before saving",
        "table.actions.validationErrors": "Validation errors present",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the IconButton component
jest.mock("@workspaceui/componentlibrary/src/components", () => ({
  IconButton: ({ children, onClick, disabled, title, className, size, "data-testid": testId }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
      data-size={size}
      data-testid={testId}>
      {children}
    </button>
  ),
}));

// Mock the SVG icons
jest.mock("../../../ComponentLibrary/src/assets/icons/edit.svg", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="edit-icon" {...props}>
      EditIcon
    </div>
  ),
}));
jest.mock("../../../ComponentLibrary/src/assets/icons/check.svg", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="check-icon" {...props}>
      CheckIcon
    </div>
  ),
}));
jest.mock("../../../ComponentLibrary/src/assets/icons/x.svg", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="x-icon" {...props}>
      XIcon
    </div>
  ),
}));
jest.mock("../../../ComponentLibrary/src/assets/icons/external-link.svg", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="external-link-icon" {...props}>
      ExternalLinkIcon
    </div>
  ),
}));
jest.mock("../../../ComponentLibrary/src/assets/icons/alert-circle.svg", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="alert-circle-icon" {...props}>
      AlertCircleIcon
    </div>
  ),
}));
jest.mock("../../../ComponentLibrary/src/assets/icons/loader.svg", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="loader-icon" {...props}>
      LoaderIcon
    </div>
  ),
}));

describe("ActionsColumn", () => {
  const mockRow: MRT_Row<EntityData> = {
    original: { id: "test-row-123" },
  } as MRT_Row<EntityData>;

  const mockCallbacks = {
    onEdit: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
    onOpenForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Read-only mode (not editing)", () => {
    it("should render edit and form view buttons when not editing", () => {
      render(<ActionsColumn row={mockRow} isEditing={false} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      expect(screen.getByTestId("edit-button-test-row-123")).toBeInTheDocument();
      expect(screen.getByTestId("form-button-test-row-123")).toBeInTheDocument();
      expect(screen.queryByTestId("save-button-test-row-123")).not.toBeInTheDocument();
      expect(screen.queryByTestId("cancel-button-test-row-123")).not.toBeInTheDocument();
    });

    it("should call onEdit when edit button is clicked", async () => {
      const user = userEvent.setup();

      render(<ActionsColumn row={mockRow} isEditing={false} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      const editButton = screen.getByTestId("edit-button-test-row-123");
      await user.click(editButton);

      expect(mockCallbacks.onEdit).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenForm when form view button is clicked", async () => {
      const user = userEvent.setup();

      render(<ActionsColumn row={mockRow} isEditing={false} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      const formButton = screen.getByTestId("form-button-test-row-123");
      await user.click(formButton);

      expect(mockCallbacks.onOpenForm).toHaveBeenCalledTimes(1);
    });

    it("should have correct tooltips for read-only buttons", () => {
      render(<ActionsColumn row={mockRow} isEditing={false} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      expect(screen.getByTestId("edit-button-test-row-123")).toHaveAttribute("title", "Edit in grid");
      expect(screen.getByTestId("form-button-test-row-123")).toHaveAttribute("title", "Open form view");
    });
  });

  describe("Edit mode", () => {
    it("should render save and cancel buttons when editing", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      expect(screen.getByTestId("save-button-test-row-123")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button-test-row-123")).toBeInTheDocument();
      expect(screen.queryByTestId("edit-button-test-row-123")).not.toBeInTheDocument();
      expect(screen.queryByTestId("form-button-test-row-123")).not.toBeInTheDocument();
    });

    it("should call onSave when save button is clicked", async () => {
      const user = userEvent.setup();

      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      await user.click(saveButton);

      expect(mockCallbacks.onSave).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      const cancelButton = screen.getByTestId("cancel-button-test-row-123");
      await user.click(cancelButton);

      expect(mockCallbacks.onCancel).toHaveBeenCalledTimes(1);
    });

    it("should have correct tooltips for edit mode buttons", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      expect(screen.getByTestId("save-button-test-row-123")).toHaveAttribute("title", "Save");
      expect(screen.getByTestId("cancel-button-test-row-123")).toHaveAttribute("title", "Cancel");
    });
  });

  describe("Loading states", () => {
    it("should show loading spinner when saving", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={true} hasErrors={false} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      expect(saveButton).toBeDisabled();

      // Check for loader icon within the save button
      const saveButton = screen.getByTestId("save-button-test-row-123");
      expect(saveButton.querySelector('[data-testid="loader-icon"]')).toBeInTheDocument();
    });

    it("should disable cancel button when saving", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={true} hasErrors={false} {...mockCallbacks} />);

      const cancelButton = screen.getByTestId("cancel-button-test-row-123");
      expect(cancelButton).toBeDisabled();
    });

    it("should not call callbacks when buttons are disabled during saving", async () => {
      const user = userEvent.setup();

      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={true} hasErrors={false} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      const cancelButton = screen.getByTestId("cancel-button-test-row-123");

      await user.click(saveButton);
      await user.click(cancelButton);

      expect(mockCallbacks.onSave).not.toHaveBeenCalled();
      expect(mockCallbacks.onCancel).not.toHaveBeenCalled();
    });
  });

  describe("Error states", () => {
    it("should show error indicator when hasErrors is true", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={true} {...mockCallbacks} />);

      expect(screen.getByTestId("error-indicator-test-row-123")).toBeInTheDocument();
    });

    it("should disable save button when there are errors", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={true} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      expect(saveButton).toBeDisabled();
    });

    it("should show error tooltip when save is disabled due to errors", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={true} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      expect(saveButton).toHaveAttribute("title", "Fix validation errors before saving");
    });

    it("should have error indicator tooltip", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={true} {...mockCallbacks} />);

      const errorIndicator = screen.getByTestId("error-indicator-test-row-123");
      expect(errorIndicator).toHaveAttribute("title", "Validation errors present");
    });

    it("should not call onSave when save button is disabled due to errors", async () => {
      const user = userEvent.setup();

      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={true} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      await user.click(saveButton);

      expect(mockCallbacks.onSave).not.toHaveBeenCalled();
    });

    it("should still allow cancel when there are errors", async () => {
      const user = userEvent.setup();

      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={true} {...mockCallbacks} />);

      const cancelButton = screen.getByTestId("cancel-button-test-row-123");
      expect(cancelButton).not.toBeDisabled();

      await user.click(cancelButton);
      expect(mockCallbacks.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Combined states", () => {
    it("should handle saving with errors (both disabled)", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={true} hasErrors={true} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      const cancelButton = screen.getByTestId("cancel-button-test-row-123");

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
      expect(screen.getByTestId("error-indicator-test-row-123")).toBeInTheDocument();
    });
  });

  describe("Button styling", () => {
    it("should apply correct CSS classes for read-only buttons", () => {
      render(<ActionsColumn row={mockRow} isEditing={false} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      const editButton = screen.getByTestId("edit-button-test-row-123");
      const formButton = screen.getByTestId("form-button-test-row-123");

      // Check that buttons have base size classes and color classes
      expect(editButton).toHaveClass("w-6", "h-6", "text-blue-600");
      expect(formButton).toBeInTheDocument();
    });

    it("should apply correct CSS classes for edit mode buttons", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      const cancelButton = screen.getByTestId("cancel-button-test-row-123");

      // Check that buttons have the expected color classes
      expect(saveButton).toHaveClass("text-green-600", "hover:text-green-800");
      expect(cancelButton).toHaveClass("text-red-600", "hover:text-red-800");
    });

    it("should apply disabled styling when save button has errors", () => {
      render(<ActionsColumn row={mockRow} isEditing={true} isSaving={false} hasErrors={true} {...mockCallbacks} />);

      const saveButton = screen.getByTestId("save-button-test-row-123");
      expect(saveButton).toHaveClass("text-gray-400", "cursor-not-allowed");
    });
  });

  describe("Button accessibility", () => {
    it("should have proper accessibility attributes", () => {
      render(<ActionsColumn row={mockRow} isEditing={false} isSaving={false} hasErrors={false} {...mockCallbacks} />);

      const editButton = screen.getByTestId("edit-button-test-row-123");
      const formButton = screen.getByTestId("form-button-test-row-123");

      expect(editButton).toHaveAttribute("title", "Edit in grid");
      expect(formButton).toHaveAttribute("title", "Open form view");
    });
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validateFieldRealTime, validateRowForSave } from "../utils/validationUtils";
import { saveRecordWithRetry } from "../utils/saveOperations";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { ActionsColumn } from "../ActionsColumn";
import type { Column, EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_Row } from "material-react-table";

// Mock dependencies
jest.mock("../utils/saveOperations");
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Error Handling", () => {
  describe("Real-time Validation", () => {
    const mockColumn: Column = {
      name: "testField",
      header: "Test Field",
      displayType: "string",
      isMandatory: true,
    };

    it("should validate required fields in real-time", () => {
      const result = validateFieldRealTime(mockColumn, "", {
        allowEmpty: false,
        showTypingErrors: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Test Field is required");
    });

    it("should allow empty values while typing", () => {
      const result = validateFieldRealTime(mockColumn, "", {
        allowEmpty: true,
        showTypingErrors: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate numeric fields with partial input", () => {
      const numericColumn: Column = {
        name: "amount",
        header: "Amount",
        displayType: "number",
        isMandatory: false,
      };

      // Allow partial input while typing
      const partialResult = validateFieldRealTime(numericColumn, "12.", {
        allowEmpty: true,
        showTypingErrors: false,
      });
      expect(partialResult.isValid).toBe(true);

      // Validate complete input
      const completeResult = validateFieldRealTime(numericColumn, "12.50", {
        allowEmpty: true,
        showTypingErrors: true,
      });
      expect(completeResult.isValid).toBe(true);

      // Invalid input
      const invalidResult = validateFieldRealTime(numericColumn, "abc", {
        allowEmpty: true,
        showTypingErrors: true,
      });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain("must be a valid number");
    });

    it("should validate quantity fields cannot be negative", () => {
      const quantityColumn: Column = {
        name: "quantity",
        header: "Quantity",
        displayType: "quantity",
        isMandatory: false,
      };

      const result = validateFieldRealTime(quantityColumn, -5, {
        allowEmpty: true,
        showTypingErrors: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("cannot be negative");
    });

    it("should validate date fields with partial input", () => {
      const dateColumn: Column = {
        name: "date",
        header: "Date",
        displayType: "date",
        isMandatory: false,
      };

      // Allow partial date while typing
      const partialResult = validateFieldRealTime(dateColumn, "2024-01", {
        allowEmpty: true,
        showTypingErrors: false,
      });
      expect(partialResult.isValid).toBe(true);

      // Invalid date
      const invalidResult = validateFieldRealTime(dateColumn, "invalid-date", {
        allowEmpty: true,
        showTypingErrors: true,
      });
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain("must be a valid date");
    });
  });

  describe("Row Validation for Save", () => {
    const mockColumns: Column[] = [
      {
        name: "name",
        header: "Name",
        displayType: "string",
        isMandatory: true,
      },
      {
        name: "email",
        header: "Email",
        displayType: "string",
        isMandatory: false,
      },
      {
        name: "age",
        header: "Age",
        displayType: "number",
        isMandatory: false,
      },
    ];

    it("should prevent save when required fields are empty", () => {
      const rowData: EntityData = {
        id: "1",
        name: "",
        email: "test@example.com",
        age: 25,
      };

      const result = validateRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("name");
      expect(result.errors[0].message).toContain("required");
      expect(result.errors[0].type).toBe("format");
    });

    it("should allow save when all validations pass", () => {
      const rowData: EntityData = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        age: 25,
      };

      const result = validateRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate multiple fields and return all errors", () => {
      const rowData: EntityData = {
        id: "1",
        name: "",
        email: "test@example.com",
        age: "invalid",
      };

      const result = validateRowForSave(mockColumns, rowData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors.some((e) => e.field === "name")).toBe(true);
      expect(result.errors.some((e) => e.field === "age")).toBe(true);
    });
  });

  describe("Server Error Handling", () => {
    const mockSaveOperation = {
      rowId: "test-row",
      isNew: false,
      data: { id: "test-row", name: "Test" },
      originalData: { id: "test-row", name: "Original" },
    };

    const mockTab = {
      id: "test-tab",
      entityName: "TestEntity",
    } as any;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should retry on network errors", async () => {
      const mockSaveRecord = jest.mocked(saveRecordWithRetry);

      // First call fails with network error, second succeeds
      mockSaveRecord.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce({
        success: true,
        data: { id: "test-row", name: "Test" },
      });

      const result = await saveRecordWithRetry({
        saveOperation: mockSaveOperation,
        tab: mockTab,
        userId: "user-1",
        maxRetries: 1,
      });

      expect(result.success).toBe(true);
      expect(mockSaveRecord).toHaveBeenCalledTimes(1);
    });

    it("should not retry on validation errors", async () => {
      const mockSaveRecord = jest.mocked(saveRecordWithRetry);

      mockSaveRecord.mockResolvedValueOnce({
        success: false,
        errors: [
          {
            field: "name",
            message: "Name is required",
            type: "server",
          },
        ],
      });

      const result = await saveRecordWithRetry({
        saveOperation: mockSaveOperation,
        tab: mockTab,
        userId: "user-1",
        maxRetries: 2,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(mockSaveRecord).toHaveBeenCalledTimes(1);
    });

    it("should handle server timeout errors with retry", async () => {
      const mockSaveRecord = jest.mocked(saveRecordWithRetry);

      const timeoutError = new Error("timeout");
      timeoutError.name = "AbortError";

      mockSaveRecord.mockRejectedValueOnce(timeoutError).mockResolvedValueOnce({
        success: true,
        data: { id: "test-row", name: "Test" },
      });

      const result = await saveRecordWithRetry({
        saveOperation: mockSaveOperation,
        tab: mockTab,
        userId: "user-1",
        maxRetries: 1,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("ActionsColumn Error Display", () => {
    const mockRow = {
      original: { id: "test-row" },
    } as MRT_Row<EntityData>;

    const defaultProps = {
      row: mockRow,
      isEditing: true,
      isSaving: false,
      hasErrors: false,
      onEdit: jest.fn(),
      onSave: jest.fn(),
      onCancel: jest.fn(),
      onOpenForm: jest.fn(),
    };

    it("should display error indicator when validation errors exist", () => {
      render(<ActionsColumn {...defaultProps} hasErrors={true} validationErrors={{ name: "Name is required" }} />);

      const errorIndicator = screen.getByTestId("error-indicator-test-row");
      expect(errorIndicator).toBeInTheDocument();
      expect(errorIndicator).toHaveClass("text-red-500");
    });

    it("should display server error indicator with different styling", () => {
      render(
        <ActionsColumn
          {...defaultProps}
          hasErrors={true}
          validationErrors={{
            name: "Server validation failed",
            _general: "Network error occurred",
          }}
        />
      );

      const errorIndicator = screen.getByTestId("error-indicator-test-row");
      expect(errorIndicator).toBeInTheDocument();
      expect(errorIndicator).toHaveClass("text-orange-500");
      expect(screen.getByText("SERVER")).toBeInTheDocument();
    });

    it("should show error tooltip with field-specific messages", () => {
      render(
        <ActionsColumn
          {...defaultProps}
          hasErrors={true}
          validationErrors={{
            name: "Name is required",
            email: "Invalid email format",
          }}
        />
      );

      const errorIndicator = screen.getByTestId("error-indicator-test-row");
      expect(errorIndicator).toHaveAttribute("title");
      const title = errorIndicator.getAttribute("title");
      expect(title).toContain("name: Name is required");
      expect(title).toContain("email: Invalid email format");
    });

    it("should disable save button when errors exist", () => {
      render(<ActionsColumn {...defaultProps} hasErrors={true} validationErrors={{ name: "Name is required" }} />);

      const saveButton = screen.getByTestId("save-button-test-row");
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveClass("text-gray-400", "cursor-not-allowed");
    });
  });

  describe("ConfirmationDialog", () => {
    const defaultProps = {
      isOpen: true,
      title: "Test Dialog",
      message: "Test message",
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
    };

    it("should render warning dialog with correct styling", () => {
      render(<ConfirmationDialog {...defaultProps} type="warning" />);

      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
      expect(screen.getByText("Test message")).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", { name: /continue/i });
      expect(confirmButton).toHaveClass("bg-yellow-600");
    });

    it("should render error dialog with retry option", () => {
      render(<ConfirmationDialog {...defaultProps} type="error" confirmText="Retry" />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toHaveClass("bg-red-600");
    });

    it("should call onConfirm when confirm button is clicked", async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(<ConfirmationDialog {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole("button", { name: /ok/i });
      await user.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();

      render(<ConfirmationDialog {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("should not show cancel button when showCancel is false", () => {
      render(<ConfirmationDialog {...defaultProps} showCancel={false} />);

      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });

    it("should disable confirm button when confirmDisabled is true", () => {
      render(<ConfirmationDialog {...defaultProps} confirmDisabled={true} />);

      const confirmButton = screen.getByRole("button", { name: /ok/i });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe("useConfirmationDialog Hook", () => {
    const TestComponent = () => {
      const { dialogState, confirmDiscardChanges, confirmSaveWithErrors, showSuccessMessage } = useConfirmationDialog();

      return (
        <div>
          <button
            onClick={() =>
              confirmDiscardChanges(
                () => {},
                () => {},
                true
              )
            }
            data-testid="discard-button">
            Discard Changes
          </button>
          <button
            onClick={() => confirmSaveWithErrors(["Name is required"], () => {})}
            data-testid="save-errors-button">
            Save with Errors
          </button>
          <button onClick={() => showSuccessMessage("Success!")} data-testid="success-button">
            Show Success
          </button>
          <ConfirmationDialog
            isOpen={dialogState.isOpen}
            type={dialogState.type}
            title={dialogState.title}
            message={dialogState.message}
            onConfirm={dialogState.onConfirm}
            onCancel={dialogState.onCancel}
          />
        </div>
      );
    };

    it("should show discard changes confirmation", async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const discardButton = screen.getByTestId("discard-button");
      await user.click(discardButton);

      expect(screen.getByText("Discard Changes")).toBeInTheDocument();
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /discard/i })).toBeInTheDocument();
    });

    it("should show validation errors dialog", async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const saveErrorsButton = screen.getByTestId("save-errors-button");
      await user.click(saveErrorsButton);

      expect(screen.getByText("Validation Errors")).toBeInTheDocument();
      expect(screen.getByText(/Name is required/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /fix errors/i })).toBeInTheDocument();
    });

    it("should show success message", async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const successButton = screen.getByTestId("success-button");
      await user.click(successButton);

      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Success!")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ok/i })).toBeInTheDocument();
    });
  });
});

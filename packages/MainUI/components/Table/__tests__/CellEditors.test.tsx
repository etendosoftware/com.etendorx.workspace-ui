import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { Field } from "@workspaceui/api-client/src/api/types";

import { CellEditorFactory } from "../CellEditors/CellEditorFactory";
import { TextCellEditor } from "../CellEditors/TextCellEditor";
import { SelectCellEditor } from "../CellEditors/SelectCellEditor";
import { DateCellEditor } from "../CellEditors/DateCellEditor";
import { BooleanCellEditor } from "../CellEditors/BooleanCellEditor";
import { NumericCellEditor } from "../CellEditors/NumericCellEditor";

// Mock field definitions
const createMockField = (overrides: Partial<Field> = {}): Field => ({
  name: "testField",
  label: "Test Field",
  type: FieldType.TEXT,
  required: false,
  ...overrides,
});

describe("Cell Editor Components", () => {
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("CellEditorFactory", () => {
    it("should render TextCellEditor for TEXT field type", () => {
      const field = createMockField({ type: FieldType.TEXT });

      render(
        <CellEditorFactory
          fieldType={FieldType.TEXT}
          value="test"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByDisplayValue("test")).toBeInTheDocument();
      expect(screen.getByRole("gridcell")).toBeInTheDocument();
    });

    it("should render NumericCellEditor for NUMBER field type", () => {
      const field = createMockField({ type: FieldType.NUMBER });

      render(
        <CellEditorFactory
          fieldType={FieldType.NUMBER}
          value={123}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByDisplayValue("123")).toBeInTheDocument();
    });

    it("should render DateCellEditor for DATE field type", () => {
      const field = createMockField({ type: FieldType.DATE });

      render(
        <CellEditorFactory
          fieldType={FieldType.DATE}
          value="2023-12-25"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByDisplayValue("2023-12-25")).toBeInTheDocument();
    });

    it("should render BooleanCellEditor for BOOLEAN field type", () => {
      const field = createMockField({ type: FieldType.BOOLEAN });

      render(
        <CellEditorFactory
          fieldType={FieldType.BOOLEAN}
          value={true}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("should render SelectCellEditor for LIST field type", () => {
      const field = createMockField({
        type: FieldType.LIST,
        refList: [
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ],
      });

      render(
        <CellEditorFactory
          fieldType={FieldType.LIST}
          value="option1"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("should show error message when disabled with error", () => {
      const field = createMockField();

      render(
        <CellEditorFactory
          fieldType={FieldType.TEXT}
          value="test"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={true}
          disabled={true}
        />
      );

      expect(screen.getByText("Validation error - please fix before editing")).toBeInTheDocument();
    });
  });

  describe("TextCellEditor", () => {
    it("should render with initial value", () => {
      const field = createMockField();

      render(
        <TextCellEditor
          value="initial value"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByDisplayValue("initial value")).toBeInTheDocument();
    });

    it("should call onChange when value changes", async () => {
      const user = userEvent.setup();
      const field = createMockField();

      render(
        <TextCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("gridcell");
      await user.type(input, "new value");

      expect(mockOnChange).toHaveBeenCalledWith("new value");
    });

    it("should call onBlur when input loses focus", async () => {
      const user = userEvent.setup();
      const field = createMockField();

      render(
        <TextCellEditor
          value="test"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("gridcell");
      await user.click(input);
      // Tab now prevents default and is managed by keyboard navigation
      // Use Escape to trigger blur instead
      await user.keyboard("{Escape}");

      expect(mockOnBlur).toHaveBeenCalled();
    });

    it("should handle Enter key to blur input", async () => {
      const user = userEvent.setup();
      const field = createMockField();

      render(
        <TextCellEditor
          value="test"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("gridcell");
      await user.click(input);
      await user.keyboard("{Enter}");

      expect(mockOnBlur).toHaveBeenCalled();
    });

    it("should show error styling when hasError is true", () => {
      const field = createMockField();

      render(
        <TextCellEditor
          value="test"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={true}
          disabled={false}
        />
      );

      const input = screen.getByRole("gridcell");
      expect(input).toHaveClass("border-red-500");
    });
  });

  describe("SelectCellEditor", () => {
    const mockField = createMockField({
      type: FieldType.LIST,
      refList: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" },
        { value: "option3", label: "Option 3" },
      ],
    });

    it("should render with options from refList", () => {
      render(
        <SelectCellEditor
          value="option1"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={mockField}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });

    it("should call onChange when selection changes", async () => {
      const user = userEvent.setup();

      render(
        <SelectCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={mockField}
          hasError={false}
          disabled={false}
        />
      );

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "option2");

      expect(mockOnChange).toHaveBeenCalledWith("option2");
    });

    it("should handle empty selection", async () => {
      const user = userEvent.setup();

      render(
        <SelectCellEditor
          value="option1"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={mockField}
          hasError={false}
          disabled={false}
        />
      );

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "");

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });
  });

  describe("DateCellEditor", () => {
    it("should render with formatted date value", () => {
      const field = createMockField({ type: FieldType.DATE });

      render(
        <DateCellEditor
          value="2023-12-25T10:30:00.000Z"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByDisplayValue("2023-12-25")).toBeInTheDocument();
    });

    it("should render datetime-local input for DATETIME field", () => {
      const field = createMockField({ type: FieldType.DATETIME });

      render(
        <DateCellEditor
          value="2023-12-25T10:30:00.000Z"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByDisplayValue(/2023-12-25T/);
      expect(input).toHaveAttribute("type", "datetime-local");
    });

    it("should call onChange with ISO string when date changes", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.DATE });

      render(
        <DateCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const inputs = screen.getAllByDisplayValue("");
      const input = inputs.find((i) => i.getAttribute("type") === "text");
      if (!input) throw new Error("Visible input not found");
      await user.type(input, "2023-12-25");

      expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining("2023-12-25"));
    });

    it("should handle invalid date values gracefully", () => {
      const field = createMockField({ type: FieldType.DATE });

      render(
        <DateCellEditor
          value="invalid-date-string"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      // Should render empty input for invalid date
      const inputs = screen.getAllByDisplayValue("");
      const visibleInput = inputs.find((i) => i.getAttribute("type") === "text");
      expect(visibleInput).toBeInTheDocument();
    });
  });

  describe("BooleanCellEditor", () => {
    it("should render checked checkbox for true value", () => {
      const field = createMockField({ type: FieldType.BOOLEAN });

      render(
        <BooleanCellEditor
          value={true}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByRole("checkbox")).toBeChecked();
      expect(screen.getByText("Yes")).toBeInTheDocument();
    });

    it("should render unchecked checkbox for false value", () => {
      const field = createMockField({ type: FieldType.BOOLEAN });

      render(
        <BooleanCellEditor
          value={false}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByRole("checkbox")).not.toBeChecked();
      expect(screen.getByText("No")).toBeInTheDocument();
    });

    it("should handle string boolean values", () => {
      const field = createMockField({ type: FieldType.BOOLEAN });

      render(
        <BooleanCellEditor
          value="Y"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("should call onChange when checkbox is toggled", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.BOOLEAN });

      render(
        <BooleanCellEditor
          value={false}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(mockOnChange).toHaveBeenCalledWith(true);
    });
  });

  describe("NumericCellEditor", () => {
    it("should render with numeric value", () => {
      const field = createMockField({ type: FieldType.NUMBER });

      render(
        <NumericCellEditor
          value={123.45}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByDisplayValue("123.45")).toBeInTheDocument();
    });

    it("should call onChange with parsed number", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.NUMBER });

      render(
        <NumericCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "456.78");

      expect(mockOnChange).toHaveBeenCalledWith(456.78);
    });

    it("should show validation error for invalid number", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.NUMBER });

      render(
        <NumericCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("textbox");
      // Type invalid characters that should be filtered out
      await user.type(input, "abc123");

      // The component should filter out invalid characters, so we expect a valid number
      expect(mockOnChange).toHaveBeenCalledWith(123);
    });

    it("should prevent negative values for QUANTITY field type", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.QUANTITY });

      render(
        <NumericCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "-10");

      await waitFor(() => {
        expect(screen.getByText("Quantity cannot be negative")).toBeInTheDocument();
      });
    });

    it("should handle arrow key increment/decrement", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.NUMBER });

      render(
        <NumericCellEditor
          value={10}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.keyboard("{ArrowUp}");

      expect(mockOnChange).toHaveBeenCalledWith(11);
    });
  });
});

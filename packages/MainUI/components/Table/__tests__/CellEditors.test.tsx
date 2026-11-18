import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { Field } from "@workspaceui/api-client/src/api/types";

import { CellEditorFactory } from "../CellEditors/CellEditorFactory";
import { TextCellEditor } from "../CellEditors/TextCellEditor";
import { SelectCellEditor } from "../CellEditors/SelectCellEditor";
import { DateCellEditor } from "../CellEditors/DateCellEditor";
import { BooleanCellEditor } from "../CellEditors/BooleanCellEditor";
import { NumericCellEditor, getDecimalSeparator, normalizeNumericInput } from "../CellEditors/NumericCellEditor";

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

  describe("SelectCellEditor — showTooltip prop", () => {
    const selectField = createMockField({
      type: FieldType.LIST,
      refList: [{ value: "a", label: "A" }],
    });

    it("does not set title when showTooltip=false and no error", () => {
      render(
        <SelectCellEditor
          value="a"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={selectField}
          hasError={false}
          disabled={false}
          showTooltip={false}
        />
      );
      expect(screen.getByRole("combobox")).not.toHaveAttribute("title");
    });

    it("does not set title when showTooltip=false even with error", () => {
      render(
        <SelectCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={selectField}
          hasError={true}
          disabled={false}
          showTooltip={false}
        />
      );
      expect(screen.getByRole("combobox")).not.toHaveAttribute("title");
    });

    it("sets title when showTooltip is true (default) and hasError is true", () => {
      render(
        <SelectCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={selectField}
          hasError={true}
          disabled={false}
        />
      );
      expect(screen.getByRole("combobox")).toHaveAttribute("title", "This field has validation errors");
    });

    it("fallback input has no title when showTooltip=false", () => {
      const tableDirField = createMockField({
        type: FieldType.TABLEDIR,
        refList: [],
        referencedEntity: "SomeEntity",
      });
      render(
        <SelectCellEditor
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={tableDirField}
          hasError={false}
          disabled={false}
          showTooltip={false}
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("title");
      expect(screen.queryByText(/TABLEDIR field/)).not.toBeInTheDocument();
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

      const { container } = render(
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
      expect(container.querySelector(".inline-edit-boolean-container svg")).toBeInTheDocument();
    });

    it("should render unchecked checkbox for false value", () => {
      const field = createMockField({ type: FieldType.BOOLEAN });

      const { container } = render(
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
      expect(container.querySelector(".inline-edit-boolean-container svg")).not.toBeInTheDocument();
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

    it("should not render a keyboard hint under a quantity input", () => {
      // The hint made the cell taller than its row and got cut off; the arrow keys still work.
      const field = createMockField({ type: FieldType.QUANTITY });

      render(
        <NumericCellEditor
          value={100}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
      expect(screen.queryByText(/arrows to adjust/i)).not.toBeInTheDocument();
    });

    it("should show the initial value when it is auto-focused on mount", () => {
      // The first editable cell of an inline row is focused as it mounts: a new line's Line No. default (50)
      // must still be shown, even though the value sync skips an input that already has the focus.
      const field = createMockField({ type: FieldType.NUMBER });

      render(
        <NumericCellEditor
          value={50}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
          shouldAutoFocus
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
      expect(input).toHaveValue("50");
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

    it("should select all on focus so typing replaces a seeded default value", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.NUMBER });

      render(
        <NumericCellEditor
          value={0}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("0");

      // Spy on select so we don't depend on jsdom's selection model.
      const selectSpy = jest.spyOn(input, "select");

      await user.click(input);
      expect(selectSpy).toHaveBeenCalled();

      // Simulate the contiguous "select-then-type" UX: when the input has all
      // text selected, typing replaces it. jsdom doesn't apply selection
      // semantics in `user.type`, so clear first and then assert the final
      // onChange call reflects the replacement (not a prepend).
      await user.clear(input);
      await user.type(input, "1");
      expect(mockOnChange).toHaveBeenLastCalledWith(1);
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

    it("accepts a negative value in a Number column (reference 22), like Discount %", async () => {
      const user = userEvent.setup();
      const field = createMockField({
        type: FieldType.QUANTITY,
        column: { reference: "22" } as Field["column"],
      });

      render(
        <NumericCellEditor
          value={null}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          field={field}
          hasError={false}
          disabled={false}
        />
      );
      await user.type(screen.getByRole("textbox"), "-50");

      expect(mockOnChange).toHaveBeenLastCalledWith(-50);
      expect(screen.queryByText("Quantity cannot be negative")).not.toBeInTheDocument();
    });

    it("keeps every digit typed in a cell that was focused automatically (ETP-6334)", async () => {
      const user = userEvent.setup();
      const field = createMockField({ type: FieldType.NUMBER });
      const Row = () => {
        const [value, setValue] = React.useState<number | null>(10);
        return (
          <NumericCellEditor
            value={value}
            onChange={setValue}
            onBlur={mockOnBlur}
            field={field}
            hasError={false}
            disabled={false}
            shouldAutoFocus
          />
        );
      };

      render(<Row />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();
      // The cell starts with its text selected, so the first digit replaces it; the next ones must add to it
      await user.keyboard("45");

      expect(input).toHaveValue("45");
    });

    describe("a value set from outside while the cell has the focus (ETP-6334)", () => {
      const renderEditor = (value: number | null) => {
        const field = createMockField({ type: FieldType.NUMBER });
        const element = (current: number | null) => (
          <NumericCellEditor
            value={current}
            onChange={mockOnChange}
            onBlur={mockOnBlur}
            field={field}
            hasError={false}
            disabled={false}
          />
        );
        const view = render(element(value));
        return { ...view, rerenderWith: (next: number | null) => view.rerender(element(next)) };
      };

      it("shows the value a callout fills in, as the line amount after a price change", async () => {
        const user = userEvent.setup();
        const { rerenderWith } = renderEditor(2);
        const input = screen.getByRole("textbox");
        await user.click(input);

        rerenderWith(15);

        expect(input).toHaveFocus();
        expect(input).toHaveValue("15");
      });

      it("does not reformat what the user is typing when the row hands the same number back", async () => {
        const user = userEvent.setup();
        const { rerenderWith } = renderEditor(null);
        const input = screen.getByRole("textbox");
        await user.click(input);
        await user.type(input, "01");

        // The row stores what the editor emitted (1) and passes it back down
        rerenderWith(1);

        expect(input).toHaveValue("01");
      });

      it("shows the value of a callout after the user has typed in the cell", async () => {
        const user = userEvent.setup();
        const { rerenderWith } = renderEditor(null);
        const input = screen.getByRole("textbox");
        await user.click(input);
        await user.type(input, "5");
        rerenderWith(5);

        rerenderWith(7);

        expect(input).toHaveValue("7");
      });
    });
  });

  describe("normalizeNumericInput", () => {
    it("reads a comma as the decimal separator in languages that use it", () => {
      const separator = getDecimalSeparator("es_ES");
      expect(separator).toBe(",");
      expect(Number(normalizeNumericInput("1,5", separator))).toBe(1.5);
      expect(Number(normalizeNumericInput("1.234,56", separator))).toBe(1234.56);
    });

    it("drops comma thousand separators in dot-decimal languages", () => {
      const separator = getDecimalSeparator("en_US");
      expect(separator).toBe(".");
      expect(Number(normalizeNumericInput("1,234.5", separator))).toBe(1234.5);
    });
  });
});

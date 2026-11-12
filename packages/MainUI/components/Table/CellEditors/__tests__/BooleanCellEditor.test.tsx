import { act, fireEvent, render, screen } from "@testing-library/react";
import BooleanCellEditor from "../BooleanCellEditor";

const mockHandleNavigationKeyDown = jest.fn();
const mockSetFocused = jest.fn();

jest.mock("../../utils/keyboardNavigation", () => ({
  useKeyboardNavigation: () => ({
    handleKeyDown: mockHandleNavigationKeyDown,
    setFocused: mockSetFocused,
  }),
}));

jest.mock("../../../../../ComponentLibrary/src/assets/icons/check.svg", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: { "data-testid"?: string }) => <svg data-testid={testId} />,
}));

const FIELD = { name: "Active" };

type EditorProps = React.ComponentProps<typeof BooleanCellEditor>;

const renderEditor = (props: Record<string, unknown> = {}) => {
  const onChange = jest.fn();
  const onBlur = jest.fn();
  const view = render(
    <BooleanCellEditor
      {...({
        value: false,
        onChange,
        onBlur,
        field: FIELD,
        rowId: "row-1",
        columnId: "active",
        ...props,
      } as unknown as EditorProps)}
    />
  );
  return { ...view, onChange, onBlur, checkbox: screen.getByRole("checkbox") as HTMLInputElement };
};

describe("BooleanCellEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleNavigationKeyDown.mockResolvedValue(false);
  });

  describe("the value it shows", () => {
    it.each([
      [true, true],
      [false, false],
      ["true", true],
      [" TRUE ", true],
      ["Y", true],
      ["y", true],
      ["1", true],
      ["yes", true],
      ["N", false],
      ["no", false],
      ["", false],
      [1, true],
      [-2, true],
      [0, false],
      [null, false],
      [undefined, false],
      [{}, false],
    ])("reads %p as checked: %p", (value, expected) => {
      const { checkbox } = renderEditor({ value });

      expect(checkbox.checked).toBe(expected);
    });

    it("shows the check mark only while it is checked", () => {
      const { rerender, checkbox } = renderEditor({ value: true });
      expect(screen.getByTestId("BooleanCellEditor__CheckIcon")).toBeInTheDocument();

      rerender(<BooleanCellEditor {...({ value: false, field: FIELD, rowId: "row-1", columnId: "active" } as any)} />);

      expect(checkbox.checked).toBe(false);
      expect(screen.queryByTestId("BooleanCellEditor__CheckIcon")).not.toBeInTheDocument();
    });

    it("is named after the field and tied to its row and column", () => {
      const { checkbox } = renderEditor();

      expect(checkbox).toHaveAttribute("aria-label", "Active");
      expect(checkbox).toHaveAttribute("title", "Active");
      expect(checkbox).toHaveAttribute("data-row-id", "row-1");
      expect(checkbox).toHaveAttribute("data-column-id", "active");
    });
  });

  describe("changes", () => {
    it("reports the new value and shows it", () => {
      const { checkbox, onChange } = renderEditor({ value: false });

      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(true);
      expect(checkbox.checked).toBe(true);

      fireEvent.click(checkbox);

      expect(onChange).toHaveBeenLastCalledWith(false);
    });

    it("reports when it loses the focus", () => {
      const { checkbox, onBlur } = renderEditor();

      fireEvent.blur(checkbox);

      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it("registers its cell as focused when it receives the focus", () => {
      const { checkbox } = renderEditor();

      fireEvent.focus(checkbox);

      expect(mockSetFocused).toHaveBeenCalled();
    });
  });

  describe("auto focus", () => {
    it("takes the focus when it is asked to", () => {
      const { checkbox } = renderEditor({ shouldAutoFocus: true });

      expect(checkbox).toHaveFocus();
      expect(mockSetFocused).toHaveBeenCalled();
    });

    it("does not take the focus by default", () => {
      const { checkbox } = renderEditor();

      expect(checkbox).not.toHaveFocus();
    });

    it("does not take the focus when it is disabled", () => {
      const { checkbox } = renderEditor({ shouldAutoFocus: true, disabled: true });

      expect(checkbox).not.toHaveFocus();
      expect(checkbox).toBeDisabled();
    });
  });

  describe("validation errors", () => {
    it("tells the field has errors", () => {
      const { checkbox } = renderEditor({ hasError: true });

      expect(checkbox).toHaveAttribute("aria-invalid", "true");
      expect(checkbox).toHaveAttribute("aria-describedby", "Active-error");
      expect(checkbox).toHaveAttribute("title", "This field has validation errors");
      expect(checkbox.style.borderColor).toBe("#ef4444");
    });

    it("keeps the accent color of the error when it is checked", () => {
      const { checkbox } = renderEditor({ hasError: true, value: true });

      expect(checkbox.style.backgroundColor).toBe("rgb(220, 38, 38)");
      expect(checkbox.style.borderColor).toBe("#dc2626");
    });

    it("uses the brand color when it is checked without errors", () => {
      const { checkbox } = renderEditor({ value: true });

      expect(checkbox.style.backgroundColor).toBe("rgb(42, 23, 87)");
    });

    it("is not described by an error element without errors", () => {
      const { checkbox } = renderEditor();

      expect(checkbox).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("keyboard", () => {
    const press = async (checkbox: HTMLElement, key: string) => {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      await act(async () => {
        checkbox.dispatchEvent(event);
      });
      return event;
    };

    it("leaves the key to the navigation when it handles it", async () => {
      mockHandleNavigationKeyDown.mockResolvedValue(true);
      const { checkbox } = renderEditor({ value: true });

      const event = await press(checkbox, "Enter");

      expect(event.defaultPrevented).toBe(false);
    });

    it("leaves the focus on Enter when the navigation does not handle it", async () => {
      const { checkbox } = renderEditor({ shouldAutoFocus: true });

      const event = await press(checkbox, "Enter");

      expect(event.defaultPrevented).toBe(true);
      expect(checkbox).not.toHaveFocus();
    });

    it("goes back to the original value on Escape", async () => {
      const { checkbox } = renderEditor({ value: false, shouldAutoFocus: true });
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      const event = await press(checkbox, "Escape");

      expect(event.defaultPrevented).toBe(true);
      expect(checkbox.checked).toBe(false);
      expect(checkbox).not.toHaveFocus();
    });

    it("lets Space toggle the checkbox", async () => {
      const { checkbox } = renderEditor();

      const event = await press(checkbox, " ");

      expect(event.defaultPrevented).toBe(false);
    });

    it.each(["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"])(
      "lets %s move the focus as the browser does",
      async (key) => {
        const { checkbox } = renderEditor();

        const event = await press(checkbox, key);

        expect(event.defaultPrevented).toBe(false);
      }
    );

    it("blocks printable characters, which must not change the checkbox", async () => {
      const { checkbox } = renderEditor();

      const event = await press(checkbox, "a");

      expect(event.defaultPrevented).toBe(true);
    });

    it("lets keys that print nothing through", async () => {
      const { checkbox } = renderEditor();

      const event = await press(checkbox, "Shift");

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("re-rendering", () => {
    it("follows a new value of the cell", () => {
      const { rerender, checkbox } = renderEditor({ value: false });

      rerender(<BooleanCellEditor {...({ value: "Y", field: FIELD, rowId: "row-1", columnId: "active" } as any)} />);

      expect(checkbox.checked).toBe(true);
    });
  });
});

/**
 * Tests for MultiRecordSelector: chips rendering, removal, modal wiring,
 * and CSV persistence in both `field.hqlName` and `field.hqlName$_identifier`.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useForm, FormProvider } from "react-hook-form";
import type { Field, EntityData } from "@workspaceui/api-client/src/api/types";
import { MultiRecordSelector } from "../MultiRecordSelector";

// Capture the props the (mocked) SelectorModal receives so each test can assert
// against them and trigger the multi-select callback synthetically.
let capturedModalProps: Record<string, unknown> | null = null;

jest.mock("../SelectorModal", () => {
  const MockSelectorModal = (props: Record<string, unknown>) => {
    capturedModalProps = props;
    return props.isOpen ? <div data-testid="MockSelectorModal" /> : null;
  };
  return { __esModule: true, default: MockSelectorModal };
});

// Override the global IconButton mock so onClick is forwarded (the default
// repo-wide mock at __mocks__/@workspaceui/componentlibrary/src/components/IconButton.js
// drops it, which would prevent the "open modal" interactions in these tests).
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({ children, onClick, className, "data-testid": testId }: Record<string, unknown>) => (
    <button
      type="button"
      onClick={onClick as () => void}
      className={className as string}
      data-testid={(testId as string) ?? "icon-button"}>
      {children as React.ReactNode}
    </button>
  ),
}));

const FIELD: Field = {
  id: "f1",
  name: "Accounting Status",
  hqlName: "accounting_status",
  inputName: "accounting_status",
  columnName: "accounting_status",
  column: { reference: "87E6CFF8F71548AFA33F181C317970B5" },
} as unknown as Field;

const renderWithForm = (
  defaultValues: Record<string, unknown>,
  props: Partial<{ field: Field; isReadOnly: boolean }> = {}
) => {
  const captured: { setValue: jest.Mock } = { setValue: jest.fn() };

  const Wrapper = () => {
    const methods = useForm({ defaultValues });
    // Spy on setValue to assert form updates.
    const originalSetValue = methods.setValue;
    captured.setValue = jest.fn((...args) => originalSetValue(...(args as Parameters<typeof originalSetValue>)));
    methods.setValue = captured.setValue as typeof methods.setValue;
    return (
      <FormProvider {...methods}>
        <MultiRecordSelector field={props.field ?? FIELD} isReadOnly={props.isReadOnly} />
      </FormProvider>
    );
  };

  const utils = render(<Wrapper />);
  return { ...utils, setValueMock: captured.setValue };
};

describe("MultiRecordSelector", () => {
  beforeEach(() => {
    capturedModalProps = null;
  });

  it("renders no chips and a search button when form value is empty", () => {
    renderWithForm({});
    expect(screen.queryAllByText(/^[A-Za-z]/)).toHaveLength(0);
    expect(screen.getByTestId(`MultiRecordSelectorOpen__${FIELD.id}`)).toBeInTheDocument();
  });

  it("renders one chip per id, paired with identifier labels", () => {
    renderWithForm({
      accounting_status: "a,b",
      accounting_status$_identifier: "Drafted, Completed",
    });
    expect(screen.getByText("Drafted")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("falls back to raw ID when identifier is missing (no crash)", () => {
    renderWithForm({ accounting_status: "rawid" });
    expect(screen.getByText("rawid")).toBeInTheDocument();
  });

  it("removes the corresponding entry from both CSVs when chip X is clicked", () => {
    const { setValueMock } = renderWithForm({
      accounting_status: "a,b",
      accounting_status$_identifier: "Drafted, Completed",
    });

    // MUI Chip's delete button has role=button and aria-label="delete" / data-testid CancelIcon.
    // Easiest: query by the SVG class MUI adds.
    const deleteIcons = document.querySelectorAll(".MuiChip-deleteIcon");
    fireEvent.click(deleteIcons[0]);

    expect(setValueMock).toHaveBeenCalledWith("accounting_status", "b", expect.any(Object));
    expect(setValueMock).toHaveBeenCalledWith("accounting_status$_identifier", "Completed", expect.any(Object));
  });

  it("clearing the last chip results in empty CSVs", () => {
    const { setValueMock } = renderWithForm({
      accounting_status: "only",
      accounting_status$_identifier: "Only",
    });
    fireEvent.click(document.querySelector(".MuiChip-deleteIcon") as Element);
    expect(setValueMock).toHaveBeenCalledWith("accounting_status", "", expect.any(Object));
    expect(setValueMock).toHaveBeenCalledWith("accounting_status$_identifier", "", expect.any(Object));
  });

  it("opens the modal with initialSelectedIds parsed from CSV", () => {
    renderWithForm({
      accounting_status: "a,b",
      accounting_status$_identifier: "Drafted, Completed",
    });
    fireEvent.click(screen.getByTestId(`MultiRecordSelectorOpen__${FIELD.id}`));
    expect(screen.getByTestId("MockSelectorModal")).toBeInTheDocument();
    expect(capturedModalProps).toMatchObject({
      multiSelect: true,
      initialSelectedIds: ["a", "b"],
    });
  });

  it("rebuilds both CSVs from records on onMultiSelect", () => {
    const { setValueMock } = renderWithForm({});
    fireEvent.click(screen.getByTestId(`MultiRecordSelectorOpen__${FIELD.id}`));

    const onMultiSelect = capturedModalProps?.onMultiSelect as (records: EntityData[]) => void;
    onMultiSelect([
      { id: "a", _identifier: "Drafted" } as unknown as EntityData,
      { id: "c", _identifier: "Voided" } as unknown as EntityData,
    ]);

    expect(setValueMock).toHaveBeenCalledWith("accounting_status", "a,c", expect.any(Object));
    expect(setValueMock).toHaveBeenCalledWith("accounting_status$_identifier", "Drafted, Voided", expect.any(Object));
  });

  it("when isReadOnly: chips are not deletable and search button is hidden", () => {
    renderWithForm(
      {
        accounting_status: "a",
        accounting_status$_identifier: "Drafted",
      },
      { isReadOnly: true }
    );
    expect(document.querySelector(".MuiChip-deleteIcon")).toBeNull();
    expect(screen.queryByTestId("icon-button")).toBeNull();
  });
});

/**
 * The date editor of the grid shows and sends the calendar day of its value in any browser timezone.
 * Jest gives each test a copy of process.env, so the timezone must be set when jest starts:
 * `pnpm test:date-timezones` runs this file in Europe/Madrid, UTC and America/Argentina/Buenos_Aires.
 */
import { render, fireEvent } from "@testing-library/react";
import { FieldType, type Field } from "@workspaceui/api-client/src/api/types";
import { DateCellEditor } from "../DateCellEditor";

jest.mock("../../utils/keyboardNavigation", () => ({
  useKeyboardNavigation: () => ({ handleKeyDown: jest.fn(async () => false), setFocused: jest.fn() }),
}));

const dateField = { name: "Scheduled Delivery Date", type: FieldType.DATE } as unknown as Field;

function renderEditor(value: unknown, onChange = jest.fn()) {
  const result = render(
    <DateCellEditor
      value={value}
      onChange={onChange}
      onBlur={jest.fn()}
      field={dateField}
      rowId="row-1"
      columnId="scheduledDeliveryDate"
    />
  );
  const hidden = result.container.querySelector('input[type="date"]') as HTMLInputElement;
  return { ...result, hidden, onChange };
}

describe("DateCellEditor calendar day", () => {
  it.each([
    ["a plain date", "2025-08-15"],
    ["a date at local midnight", "2025-08-15T00:00:00"],
    ["a date with milliseconds at local midnight", "2025-08-15T00:00:00.000"],
    ["a date near the end of the day", "2025-08-15T23:30:00"],
  ])("keeps the day of %s", (_label, value) => {
    const { hidden } = renderEditor(value);

    expect(hidden.value).toBe("2025-08-15");
  });

  it("sends the picked day as yyyy-MM-dd", () => {
    const { hidden, onChange } = renderEditor("");

    fireEvent.change(hidden, { target: { value: "2025-08-15" } });

    expect(onChange).toHaveBeenCalledWith("2025-08-15");
  });

  it("shows an empty editor for an empty value", () => {
    const { hidden } = renderEditor(null);

    expect(hidden.value).toBe("");
  });
});

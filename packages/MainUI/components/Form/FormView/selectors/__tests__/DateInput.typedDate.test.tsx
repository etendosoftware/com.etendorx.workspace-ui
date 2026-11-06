/**
 * A date typed by hand must behave like one picked from the calendar: the typed day is kept whatever the
 * browser timezone, and it is committed only when the user finishes typing (leaving the field or Enter).
 *
 * These tests use the real date autocomplete, only the locale format is fixed to dd/mm/yyyy. Jest gives each
 * test a copy of process.env, so the timezone must be set when jest starts: `pnpm test:date-timezones` runs
 * this file in Europe/Madrid, UTC and America/Argentina/Buenos_Aires.
 */
import { render, fireEvent } from "@testing-library/react";
import { DateInput } from "../components/DateInput";
import { mockDateField } from "../test-utils/dateInputHelpers";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("@workspaceui/componentlibrary/src/utils/dateFormatter", () => ({
  getLocaleDatePlaceholder: () => "dd/mm/yyyy",
  formatClassicDate: (isoDate: string) => {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  },
}));

const TYPED_DATE = "15/08/2025";
const TYPED_ISO = "2025-08-15";

function renderDateInput() {
  const onChange = jest.fn();
  const result = render(
    <DateInput name="dateField" field={mockDateField as unknown as Field} onChange={onChange} onBlur={jest.fn()} />
  );
  const visible = result.container.querySelector('input[type="text"]') as HTMLInputElement;
  const hidden = result.container.querySelector('input[type="date"]') as HTMLInputElement;
  return { ...result, visible, hidden, onChange };
}

function type(visible: HTMLInputElement, text: string) {
  fireEvent.focus(visible);
  fireEvent.change(visible, { target: { value: text } });
}

describe("DateInput typed dates", () => {
  it("keeps the typed day when the user leaves the field", () => {
    const { visible, hidden, onChange } = renderDateInput();

    type(visible, TYPED_DATE);
    fireEvent.blur(visible);

    expect(hidden.value).toBe(TYPED_ISO);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(visible.value).toBe(TYPED_DATE);
  });

  it("keeps the typed day when the user presses Enter", () => {
    const { visible, hidden, onChange } = renderDateInput();

    type(visible, TYPED_DATE);
    fireEvent.keyDown(visible, { key: "Enter" });

    expect(hidden.value).toBe(TYPED_ISO);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("does not apply the intermediate dates while the user is still typing", () => {
    const { visible, hidden, onChange } = renderDateInput();

    for (const partial of ["1", "15", "15/", "15/0", "15/08", "15/08/", "15/08/2", "15/08/20", "15/08/202"]) {
      type(visible, partial);
    }

    expect(onChange).not.toHaveBeenCalled();
    expect(hidden.value).toBe("");
    expect(visible.value).toBe("15/08/202");
  });

  it("applies only the final date once the user leaves the field", () => {
    const { visible, hidden, onChange } = renderDateInput();

    for (const partial of ["15/08/2", "15/08/20", "15/08/202", TYPED_DATE]) {
      type(visible, partial);
    }
    fireEvent.blur(visible);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(hidden.value).toBe(TYPED_ISO);
  });

  it("does not apply the same date twice when Enter is followed by leaving the field", () => {
    const { visible, onChange } = renderDateInput();

    type(visible, TYPED_DATE);
    fireEvent.keyDown(visible, { key: "Enter" });
    fireEvent.blur(visible);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("clears the value when the field is emptied and left", () => {
    const { visible, hidden, onChange } = renderDateInput();

    type(visible, TYPED_DATE);
    fireEvent.blur(visible);
    onChange.mockClear();

    type(visible, "");
    fireEvent.blur(visible);

    expect(hidden.value).toBe("");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("clears the value when an invalid date is typed and left", () => {
    const { visible, hidden } = renderDateInput();

    type(visible, TYPED_DATE);
    fireEvent.blur(visible);
    type(visible, "31/02/2025");
    fireEvent.blur(visible);

    expect(hidden.value).toBe("");
  });
});

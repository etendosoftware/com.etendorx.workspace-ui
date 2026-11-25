/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { formatBrowserDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { DateSelector } from "../DateSelector";

// A stable function, as the real hook returns a memoized one
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    "dateModal.from": "From",
    "dateModal.to": "To",
    "dateModal.invalidDate": "Invalid date",
    "dateModal.oneDate": "One date",
    "dateModal.range": "Range",
    "common.confirm": "Confirm",
  };
  return translations[key] ?? key;
};

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: mockT }),
}));

const DEBOUNCE_MS = 500;
const OCT_13 = new Date(2026, 9, 13);
const OCT_20 = new Date(2026, 9, 20);
const ISO_OCT_13 = "2026-10-13";
const ISO_OCT_20 = "2026-10-20";
const ARIA_INVALID = "aria-invalid";
const PICKER_TITLE = "Open date picker for Order Date";
const EXPRESSION = ">=2026-10-01";
const COLUMN = { id: "orderDate", name: "Order Date", columnName: "orderDate" } as unknown as Column;

const renderSelector = (filterValue?: string) => {
  const onFilterChange = jest.fn();
  const view = render(<DateSelector column={COLUMN} filterValue={filterValue} onFilterChange={onFilterChange} />);
  const input = screen.getByPlaceholderText("Filter Order Date...");
  const rerenderWith = (value?: string) =>
    view.rerender(<DateSelector column={COLUMN} filterValue={value} onFilterChange={onFilterChange} />);
  return { onFilterChange, input, rerenderWith };
};

const typeText = (input: HTMLElement, text: string) => fireEvent.change(input, { target: { value: text } });

const openWindowAndConfirmDay = (day: string) => {
  fireEvent.click(screen.getByTitle(PICKER_TITLE));
  fireEvent.click(screen.getByRole("button", { name: day }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
};

describe("DateSelector", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("names the column by its column name when it has no name", () => {
    const unnamed = { id: "created", columnName: "creationDate" } as unknown as Column;
    render(<DateSelector column={unnamed} onFilterChange={jest.fn()} />);
    expect(screen.getByPlaceholderText("Filter creationDate...")).toBeInTheDocument();
  });

  describe("showing the applied filter", () => {
    it.each([
      ["one date, e.g. from 'Use as filter'", ISO_OCT_13, formatBrowserDate(OCT_13)],
      ["a range", `${ISO_OCT_13} - ${ISO_OCT_20}`, `${formatBrowserDate(OCT_13)} - ${formatBrowserDate(OCT_20)}`],
      ["a range open at the end", `${ISO_OCT_13} - `, `From ${formatBrowserDate(OCT_13)}`],
      ["a range open at the start", ` - ${ISO_OCT_13}`, `To ${formatBrowserDate(OCT_13)}`],
      ["an expression", ">=01/10/2026", ">=01/10/2026"],
    ])("shows %s", (_, filterValue, expected) => {
      const { input } = renderSelector(filterValue);
      expect(input).toHaveValue(expected);
    });

    it("empties the field when the filter is cleared", () => {
      const { input, rerenderWith } = renderSelector(ISO_OCT_13);
      rerenderWith();
      expect(input).toHaveValue("");
    });
  });

  describe("typing in the column", () => {
    it("applies a typed date as that day and keeps the typed text", () => {
      const { input, onFilterChange, rerenderWith } = renderSelector();
      typeText(input, ISO_OCT_13);
      act(() => jest.advanceTimersByTime(DEBOUNCE_MS));
      expect(onFilterChange).toHaveBeenCalledWith(ISO_OCT_13);
      rerenderWith(ISO_OCT_13);
      expect(input).toHaveValue(ISO_OCT_13);
    });

    it("sends a filter expression as typed", () => {
      const { input, onFilterChange } = renderSelector();
      typeText(input, EXPRESSION);
      act(() => jest.advanceTimersByTime(DEBOUNCE_MS));
      expect(onFilterChange).toHaveBeenCalledWith(EXPRESSION);
    });

    it("clears the filter when the text is deleted", () => {
      const { input, onFilterChange } = renderSelector(ISO_OCT_13);
      typeText(input, "");
      act(() => jest.advanceTimersByTime(DEBOUNCE_MS));
      expect(onFilterChange).toHaveBeenCalledWith("");
    });

    it("reports an invalid date when leaving the field and does not apply it", () => {
      const { input, onFilterChange } = renderSelector();
      typeText(input, "31/02/2026");
      act(() => jest.advanceTimersByTime(DEBOUNCE_MS));
      expect(input).toHaveAttribute(ARIA_INVALID, "false");
      fireEvent.blur(input);
      expect(input).toHaveAttribute(ARIA_INVALID, "true");
      expect(screen.getByTitle("Invalid date")).toBeInTheDocument();
      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it("removes the invalid mark when typing again", () => {
      const { input } = renderSelector();
      typeText(input, "abc");
      fireEvent.blur(input);
      typeText(input, "ab");
      expect(input).toHaveAttribute(ARIA_INVALID, "false");
    });

    it("applies the typed date at once with Enter, only once", () => {
      const { input, onFilterChange } = renderSelector();
      typeText(input, ISO_OCT_13);
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onFilterChange).toHaveBeenCalledWith(ISO_OCT_13);
      fireEvent.blur(input);
      act(() => jest.advanceTimersByTime(DEBOUNCE_MS));
      expect(onFilterChange).toHaveBeenCalledTimes(1);
    });

    it("does not check a shown filter that was not edited", () => {
      const { input } = renderSelector(`${ISO_OCT_13} - `);
      fireEvent.blur(input);
      expect(input).toHaveAttribute(ARIA_INVALID, "false");
    });
  });

  describe("the date window", () => {
    it("reopens one date in one-date mode and applies the new day", () => {
      const { input, onFilterChange } = renderSelector(ISO_OCT_13);
      fireEvent.click(screen.getByTitle(PICKER_TITLE));
      expect(screen.getByRole("button", { name: "One date" })).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(screen.getByRole("button", { name: "20" }));
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(onFilterChange).toHaveBeenCalledWith(ISO_OCT_20);
      expect(input).toHaveValue(formatBrowserDate(OCT_20));
    });

    it("applies an open range chosen in range mode", () => {
      const { input, onFilterChange } = renderSelector(`${ISO_OCT_13} - `);
      fireEvent.click(screen.getByTitle(PICKER_TITLE));
      expect(screen.getByRole("button", { name: "Range" })).toHaveAttribute("aria-pressed", "true");
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(onFilterChange).toHaveBeenCalledWith(`${ISO_OCT_13} - `);
      expect(input).toHaveValue(`From ${formatBrowserDate(OCT_13)}`);
    });

    it("replaces a pending typed value", () => {
      const { input, onFilterChange } = renderSelector(ISO_OCT_13);
      typeText(input, EXPRESSION);
      openWindowAndConfirmDay("20");
      act(() => jest.advanceTimersByTime(DEBOUNCE_MS));
      expect(onFilterChange).toHaveBeenCalledTimes(1);
      expect(onFilterChange).toHaveBeenCalledWith(ISO_OCT_20);
    });
  });
});

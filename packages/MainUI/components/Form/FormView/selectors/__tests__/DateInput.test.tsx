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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { render, fireEvent } from "@testing-library/react";
import { DateInput } from "../components/DateInput";
import { formatClassicDate, getLocaleDatePlaceholder } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { autocompleteDate } from "@/utils/dateAutocomplete";
import { MOCK_ISO_DATE, MOCK_PLACEHOLDER, mockDateField, expectedDisplay } from "../test-utils/dateInputHelpers";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("@workspaceui/componentlibrary/src/utils/dateFormatter", () => ({
  formatClassicDate: jest.fn(),
  getLocaleDatePlaceholder: jest.fn(),
}));

jest.mock("@/utils/dateAutocomplete", () => ({
  autocompleteDate: jest.fn(),
}));

const mockFormatClassicDate = formatClassicDate as jest.Mock;
const mockGetLocaleDatePlaceholder = getLocaleDatePlaceholder as jest.Mock;
const mockAutocompleteDate = autocompleteDate as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RenderOptions {
  currentValue?: string;
  isReadOnly?: boolean;
}

function renderDateInput(
  { currentValue, isReadOnly = false }: RenderOptions = {},
  onChange = jest.fn(),
  onBlur = jest.fn(),
) {
  const result = render(
    <DateInput
      name="dateField"
      field={mockDateField as unknown as Field}
      currentValue={currentValue}
      isReadOnly={isReadOnly}
      onChange={onChange}
      onBlur={onBlur}
    />,
  );

  const getVisibleInput = () =>
    result.container.querySelector('input[type="text"]') as HTMLInputElement;
  const getHiddenInput = () =>
    result.container.querySelector('input[type="date"]') as HTMLInputElement;

  return { ...result, getVisibleInput, getHiddenInput, onChange, onBlur };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DateInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocaleDatePlaceholder.mockReturnValue(MOCK_PLACEHOLDER);
    mockFormatClassicDate.mockImplementation((isoDate: string) => expectedDisplay(isoDate));
    mockAutocompleteDate.mockReturnValue(null);
  });

  // -------------------------------------------------------------------------
  // Initial sync: currentValue → display
  // -------------------------------------------------------------------------
  describe("initial display sync", () => {
    it("shows formatted date when currentValue is provided on mount", () => {
      const { getVisibleInput } = renderDateInput({ currentValue: MOCK_ISO_DATE });
      expect(getVisibleInput().value).toBe(expectedDisplay(MOCK_ISO_DATE));
    });

    it("shows empty display when currentValue is not provided", () => {
      const { getVisibleInput } = renderDateInput();
      expect(getVisibleInput().value).toBe("");
    });
  });

  // -------------------------------------------------------------------------
  // Calendar picker: handleHiddenDateChange is the real onChange (props spread fix)
  // -------------------------------------------------------------------------
  describe("calendar picker interaction", () => {
    it("updates display immediately when the hidden input fires onChange with a new date", () => {
      const { getVisibleInput, getHiddenInput } = renderDateInput();

      fireEvent.focus(getVisibleInput());
      fireEvent.change(getHiddenInput(), { target: { value: MOCK_ISO_DATE } });

      expect(getVisibleInput().value).toBe(expectedDisplay(MOCK_ISO_DATE));
    });

    it("calls props.onChange when the hidden input changes", () => {
      const onChange = jest.fn();
      const { getHiddenInput } = renderDateInput({}, onChange);

      fireEvent.change(getHiddenInput(), { target: { value: MOCK_ISO_DATE } });

      expect(onChange).toHaveBeenCalled();
    });

    it("clears the display when the hidden input fires onChange with an empty value after having a date", () => {
      const { getVisibleInput, getHiddenInput } = renderDateInput();

      // First set a date via the calendar picker
      fireEvent.change(getHiddenInput(), { target: { value: MOCK_ISO_DATE } });
      expect(getVisibleInput().value).toBe(expectedDisplay(MOCK_ISO_DATE));

      // Then clear it (simulates the user clearing the date in the picker)
      fireEvent.change(getHiddenInput(), { target: { value: "" } });

      expect(getVisibleInput().value).toBe("");
    });

    it("updates display even when focused (calendar pick after manual clear)", () => {
      // This is the primary regression: user clears the visible input, then picks from calendar.
      // isFocused is true, but handleHiddenDateChange must still update the display.
      const { getVisibleInput, getHiddenInput } = renderDateInput();

      fireEvent.focus(getVisibleInput());
      fireEvent.change(getVisibleInput(), { target: { value: "" } });
      expect(getVisibleInput().value).toBe("");

      // Calendar picker fires change on hidden input while visible input is still focused
      fireEvent.change(getHiddenInput(), { target: { value: MOCK_ISO_DATE } });

      expect(getVisibleInput().value).toBe(expectedDisplay(MOCK_ISO_DATE));
    });
  });

  // -------------------------------------------------------------------------
  // Typing behavior: isTypingRef prevents display overwrite during user input
  // -------------------------------------------------------------------------
  describe("typing behavior", () => {
    it("keeps the user-typed text in the display when autocomplete updates the hidden input", () => {
      // autocompleteDate returns a valid Date for a 3-part input, triggering setNativeInputValue.
      // isTypingRef.current is true at that moment, so handleHiddenDateChange must NOT
      // call setDisplayValue, leaving the user's raw typed text intact.
      const mockDate = new Date(2025, 2, 15); // 2025-03-15
      mockAutocompleteDate.mockImplementation((input: string) => {
        const parts = input.split(/[/.\-]/);
        return parts.length >= 3 ? mockDate : null;
      });

      const { getVisibleInput } = renderDateInput();

      fireEvent.focus(getVisibleInput());
      fireEvent.change(getVisibleInput(), { target: { value: "15/03/2025" } });

      // Display must show what the user typed, not the value returned by formatClassicDate
      expect(getVisibleInput().value).toBe("15/03/2025");
    });
  });

  // -------------------------------------------------------------------------
  // currentValue prop changes (sync useEffect with [currentValue] deps only)
  // -------------------------------------------------------------------------
  describe("currentValue prop sync", () => {
    it("updates the display when currentValue changes to a new date", () => {
      const NEW_ISO = "2025-04-20";
      const { getVisibleInput, rerender } = renderDateInput({ currentValue: MOCK_ISO_DATE });

      expect(getVisibleInput().value).toBe(expectedDisplay(MOCK_ISO_DATE));

      rerender(
        <DateInput
          name="dateField"
          field={mockDateField as unknown as Field}
          currentValue={NEW_ISO}
          onChange={jest.fn()}
          onBlur={jest.fn()}
        />,
      );

      expect(getVisibleInput().value).toBe(expectedDisplay(NEW_ISO));
    });

    it("clears the display when currentValue changes to an empty string", () => {
      const { getVisibleInput, rerender } = renderDateInput({ currentValue: MOCK_ISO_DATE });

      expect(getVisibleInput().value).toBe(expectedDisplay(MOCK_ISO_DATE));

      rerender(
        <DateInput
          name="dateField"
          field={mockDateField as unknown as Field}
          currentValue=""
          onChange={jest.fn()}
          onBlur={jest.fn()}
        />,
      );

      expect(getVisibleInput().value).toBe("");
    });

    it("does not restore old date when isFocused changes but currentValue remains the same", () => {
      // Bug fix: removing isFocused from the sync useEffect deps.
      // Previously, blurring triggered the effect, saw stale currentValue and restored the old date.
      // Now, the effect only runs when currentValue changes.
      const { getVisibleInput } = renderDateInput({ currentValue: MOCK_ISO_DATE });

      expect(getVisibleInput().value).toBe(expectedDisplay(MOCK_ISO_DATE));

      // User focuses and clears the visible input
      fireEvent.focus(getVisibleInput());
      fireEvent.change(getVisibleInput(), { target: { value: "" } });
      expect(getVisibleInput().value).toBe("");

      // User blurs (isFocused changes to false). currentValue prop has NOT changed.
      // The old sync effect would restore the date here — the new one must not.
      fireEvent.blur(getVisibleInput());

      expect(getVisibleInput().value).not.toBe(expectedDisplay(MOCK_ISO_DATE));
    });
  });

  // -------------------------------------------------------------------------
  // Read-only mode
  // -------------------------------------------------------------------------
  describe("read-only mode", () => {
    it("marks the visible input as readOnly", () => {
      const { getVisibleInput } = renderDateInput({ currentValue: MOCK_ISO_DATE, isReadOnly: true });
      expect(getVisibleInput()).toHaveAttribute("readonly");
    });

    it("disables the hidden date input", () => {
      const { getHiddenInput } = renderDateInput({ currentValue: MOCK_ISO_DATE, isReadOnly: true });
      expect(getHiddenInput()).toBeDisabled();
    });
  });
});

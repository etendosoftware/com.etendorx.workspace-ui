/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may not use this file except in compliance with the License at
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

import React, { useEffect, useRef, useState, useCallback } from "react";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { CellEditorProps } from "../types/inlineEditing";
import { useKeyboardNavigation } from "../utils/keyboardNavigation";
import { formatClassicDate, getLocaleDatePlaceholder } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import CalendarIcon from "../../../../ComponentLibrary/src/assets/icons/calendar.svg";

/**
 * Date input editor for date/datetime fields
 * Uses a dual-input approach like FormView DateInput:
 * - Visible input: Shows formatted date in browser locale
 * - Hidden input: Native HTML5 date/datetime picker
 * Memoized for performance optimization
 */
const DateCellEditorComponent: React.FC<CellEditorProps> = ({
  value,
  onChange,
  onBlur,
  field,
  hasError,
  disabled,
  rowId,
  columnId,
  keyboardNavigationManager,
  shouldAutoFocus = false,
}) => {
  const visibleInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  // Keyboard navigation hook
  const { handleKeyDown: handleNavigationKeyDown, setFocused } = useKeyboardNavigation(
    rowId || "",
    columnId || "",
    keyboardNavigationManager
  );

  // Determine if this is a datetime field
  const isDateTime = field.type === FieldType.DATETIME;

  // Auto-focus only when shouldAutoFocus is true
  useEffect(() => {
    if (hiddenInputRef.current && !disabled && shouldAutoFocus) {
      // Focus and open the picker
      hiddenInputRef.current.focus();
      hiddenInputRef.current.showPicker?.();
      // Register this cell as focused
      setFocused();
    }
  }, [shouldAutoFocus, disabled, setFocused]);

  // Initialize and sync display value when prop value changes
  useEffect(() => {
    const isoValue = formatDateForInput(value);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = isoValue;
    }

    // Update the formatted display value
    if (isoValue) {
      const formatted = formatClassicDate(value, isDateTime);
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  }, [value, isDateTime]);

  /**
   * Format a date value for the HTML input element
   */
  const formatDateForInput = (dateValue: unknown): string => {
    if (!dateValue) return "";

    try {
      const date = new Date(dateValue as string);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      if (isDateTime) {
        // Format as datetime-local (YYYY-MM-DDTHH:MM)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } else {
        // Format as date (YYYY-MM-DD)
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.warn("Error formatting date for input:", error);
      return "";
    }
  };

  /**
   * Parse input value and convert to appropriate format
   * Returns the format expected by Etendo Classic backend:
   * - DATE: yyyy-MM-dd
   * - DATETIME: yyyy-MM-ddTHH:mm:ss (without timezone)
   */
  const parseInputValue = (inputValue: string): string | null => {
    if (!inputValue) return null;

    try {
      // For date inputs, the value comes as "yyyy-MM-dd" string
      // For datetime-local inputs, the value comes as "yyyy-MM-ddTHH:mm" string

      if (isDateTime) {
        // For DATETIME fields, input format is: yyyy-MM-ddTHH:mm
        // We need to add seconds: yyyy-MM-ddTHH:mm:ss
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(inputValue)) {
          // Clear any previous validation errors
          setValidationError("");
          return `${inputValue}:00`; // Add :00 for seconds
        }

        setValidationError("Invalid datetime format");
        return null;
      } else {
        // For DATE fields, input format is already: yyyy-MM-dd
        // This is exactly what Classic expects, so return it as-is
        if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
          // Clear any previous validation errors
          setValidationError("");
          return inputValue;
        }

        setValidationError("Invalid date format");
        return null;
      }
    } catch (error) {
      setValidationError("Invalid date format");
      return null;
    }
  };

  const handleHiddenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Update the formatted display value immediately
    if (newValue) {
      const formatted = formatClassicDate(newValue, isDateTime);
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }

    // Parse and send the value in the correct format for Classic
    const parsedValue = parseInputValue(newValue);
    onChange(parsedValue);
  };

  const handleBlur = useCallback(() => {
    onBlur();
  }, [onBlur]);

  const handleVisibleInputClick = useCallback(() => {
    // When clicking the visible input, open the hidden date picker
    if (!disabled && hiddenInputRef.current) {
      hiddenInputRef.current.showPicker?.();
      hiddenInputRef.current.focus();
    }
    setFocused();
  }, [disabled, setFocused]);

  const handleCalendarClick = useCallback(() => {
    if (!disabled && hiddenInputRef.current) {
      hiddenInputRef.current.showPicker?.();
      hiddenInputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // First try keyboard navigation
    const navigationHandled = await handleNavigationKeyDown(e.nativeEvent);

    if (!navigationHandled) {
      // Handle local keyboard events if navigation didn't handle them
      switch (e.key) {
        case "Enter":
          // This should be handled by navigation, but fallback to blur
          e.preventDefault();
          hiddenInputRef.current?.blur();
          break;
        case "Escape":
          // This should be handled by navigation, but fallback to restore value
          e.preventDefault();
          const isoValue = formatDateForInput(value);
          if (hiddenInputRef.current) {
            hiddenInputRef.current.value = isoValue;
          }
          if (isoValue) {
            const formatted = formatClassicDate(value, isDateTime);
            setDisplayValue(formatted);
          } else {
            setDisplayValue("");
          }
          setValidationError("");
          hiddenInputRef.current?.blur();
          break;
        default:
          // Allow normal date input behavior
          break;
      }
    }
  };

  const inputType = isDateTime ? "datetime-local" : "date";
  const hasValidationError = hasError || !!validationError;
  const datePlaceholder = getLocaleDatePlaceholder();

  return (
    <div className="inline-edit-date-container relative flex items-center">
      {/* Visible input showing formatted date in browser locale */}
      <input
        ref={visibleInputRef}
        type="text"
        value={displayValue}
        readOnly
        onClick={handleVisibleInputClick}
        onBlur={handleBlur}
        data-row-id={rowId}
        data-column-id={columnId}
        disabled={disabled}
        className={`
          inline-edit-date-visible
          w-full
          px-2
          py-1
          pr-8
          border
          rounded
          text-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-transparent
          cursor-pointer
          ${hasValidationError ? "border-red-500 bg-red-50 text-red-900" : "border-gray-300 bg-white"}
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "hover:border-gray-400"}
        `}
        title={hasValidationError ? validationError || "This field has validation errors" : field.name}
        aria-label={field.name}
        aria-invalid={hasValidationError}
        aria-describedby={hasValidationError ? `${field.name}-error` : undefined}
        placeholder={datePlaceholder}
      />
      {/* Hidden native date/datetime picker */}
      <input
        ref={hiddenInputRef}
        type={inputType}
        onChange={handleHiddenInputChange}
        onKeyDown={handleKeyDown}
        data-row-id={rowId}
        data-column-id={columnId}
        disabled={disabled}
        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Calendar icon button */}
      <button
        type="button"
        onClick={handleCalendarClick}
        disabled={disabled}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Open date picker">
        <CalendarIcon fill="currentColor" className="h-4 w-4" data-testid={"CalendarIcon__" + field.id} />
      </button>
      {/* Show validation error message */}
      {validationError && (
        <div
          id={`${field.name}-error`}
          className="inline-edit-error-message text-xs text-red-600 mt-1 absolute top-full left-0">
          {validationError}
        </div>
      )}
    </div>
  );
};

// Memoize the component for performance optimization
export const DateCellEditor = React.memo(DateCellEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.rowId === nextProps.rowId &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.field?.name === nextProps.field?.name &&
    prevProps.field?.type === nextProps.field?.type
  );
});

DateCellEditor.displayName = "DateCellEditor";

export default DateCellEditor;

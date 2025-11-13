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

import React, { useEffect, useRef, useState } from "react";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import type { CellEditorProps } from "../types/inlineEditing";
import { useKeyboardNavigation } from "../utils/keyboardNavigation";

/**
 * Date input editor for date/datetime fields
 * Handles date formatting, parsing, validation, and error display
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState<string>("");
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
    if (inputRef.current && !disabled && shouldAutoFocus) {
      inputRef.current.focus();
      // Register this cell as focused
      setFocused();
    }
  }, [shouldAutoFocus, disabled, setFocused]);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(formatDateForInput(value));
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
   */
  const parseInputValue = (inputValue: string): string | null => {
    if (!inputValue) return null;

    try {
      const date = new Date(inputValue);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        setValidationError("Invalid date format");
        return null;
      }

      // Clear any previous validation errors
      setValidationError("");

      // Return ISO string for consistency
      return date.toISOString();
    } catch (error) {
      setValidationError("Invalid date format");
      return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    const parsedValue = parseInputValue(newValue);
    onChange(parsedValue);
  };

  const handleBlur = () => {
    onBlur();
  };

  const handleFocus = () => {
    // Register this cell as focused when it receives focus
    setFocused();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // First try keyboard navigation
    const navigationHandled = await handleNavigationKeyDown(e.nativeEvent);

    if (!navigationHandled) {
      // Handle local keyboard events if navigation didn't handle them
      switch (e.key) {
        case "Enter":
          // This should be handled by navigation, but fallback to blur
          e.preventDefault();
          inputRef.current?.blur();
          break;
        case "Escape":
          // This should be handled by navigation, but fallback to restore value
          e.preventDefault();
          setLocalValue(formatDateForInput(value));
          setValidationError("");
          inputRef.current?.blur();
          break;
        default:
          // Allow normal date input behavior
          break;
      }
    }
  };

  const inputType = isDateTime ? "datetime-local" : "date";
  const hasValidationError = hasError || !!validationError;

  return (
    <div className="inline-edit-date-container">
      <input
        ref={inputRef}
        type={inputType}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        data-row-id={rowId}
        data-column-id={columnId}
        disabled={disabled}
        className={`
          inline-edit-date
          w-full
          px-2
          py-1
          border
          rounded
          text-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-transparent
          ${hasValidationError ? "border-red-500 bg-red-50 text-red-900" : "border-gray-300 bg-white"}
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "hover:border-gray-400"}
        `}
        title={hasValidationError ? validationError || "This field has validation errors" : field.name}
        aria-label={field.name}
        aria-invalid={hasValidationError}
        aria-describedby={hasValidationError ? `${field.name}-error` : undefined}
      />

      {/* Show validation error message */}
      {validationError && (
        <div id={`${field.name}-error`} className="inline-edit-error-message text-xs text-red-600 mt-1">
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
    prevProps.field.name === nextProps.field.name &&
    prevProps.field.type === nextProps.field.type
  );
});

DateCellEditor.displayName = "DateCellEditor";

export default DateCellEditor;

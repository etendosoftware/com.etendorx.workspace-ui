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
 * Number input editor for numeric/quantity fields
 * Handles number validation, formatting, decimal places, and numeric constraints
 * Memoized for performance optimization
 */
const NumericCellEditorComponent: React.FC<CellEditorProps> = ({
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

  // Determine if this is a quantity field (might have different formatting rules)
  const isQuantity = field.type === FieldType.QUANTITY;

  // Auto-focus only when shouldAutoFocus is true
  useEffect(() => {
    if (inputRef.current && !disabled && shouldAutoFocus) {
      inputRef.current.focus();
      // Select all text for easy replacement
      inputRef.current.select();
      // Register this cell as focused
      setFocused();
    }
  }, [shouldAutoFocus, disabled, setFocused]);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(formatNumberForInput(value));
  }, [value]);

  /**
   * Format a number value for the HTML input element
   */
  const formatNumberForInput = (numValue: unknown): string => {
    if (numValue === null || numValue === undefined || numValue === "") {
      return "";
    }

    // Convert to number if it's a string
    const num = typeof numValue === "string" ? Number.parseFloat(numValue) : Number(numValue);

    if (isNaN(num)) {
      return "";
    }

    // Return as string for input display
    return String(num);
  };

  /**
   * Parse and validate input value
   */
  const parseInputValue = (inputValue: string): number | null => {
    if (!inputValue.trim()) {
      setValidationError("");
      return null;
    }

    // Remove any non-numeric characters except decimal point and minus sign
    const cleanValue = inputValue.replace(/[^0-9.-]/g, "");

    // Check for valid number format
    const numberRegex = /^-?\d*\.?\d*$/;
    if (!numberRegex.test(cleanValue)) {
      setValidationError("Invalid number format");
      return null;
    }

    const num = Number.parseFloat(cleanValue);

    if (isNaN(num)) {
      setValidationError("Invalid number");
      return null;
    }

    // Additional validation for quantity fields
    if (isQuantity && num < 0) {
      setValidationError("Quantity cannot be negative");
      return null;
    }

    // Check for reasonable number ranges
    if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
      setValidationError("Number is too large");
      return null;
    }

    // Clear any previous validation errors
    setValidationError("");
    return num;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    const parsedValue = parseInputValue(newValue);
    onChange(parsedValue);
  };

  const handleBlur = () => {
    // Format the number on blur for better display
    if (localValue && !validationError) {
      const num = Number.parseFloat(localValue);
      if (!isNaN(num)) {
        // Format with appropriate decimal places
        const formatted = isQuantity ? num.toFixed(2) : String(num);
        setLocalValue(formatted);
      }
    }
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
          setLocalValue(formatNumberForInput(value));
          setValidationError("");
          inputRef.current?.blur();
          break;
        case "ArrowUp":
          // Only increment if not handled by navigation (Ctrl+ArrowUp)
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            incrementValue(1);
          }
          break;
        case "ArrowDown":
          // Only decrement if not handled by navigation (Ctrl+ArrowDown)
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            incrementValue(-1);
          }
          break;
        default:
          // Allow numeric input, decimal point, minus sign, and control keys
          const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab"];
          const isNumericKey = /^[0-9]$/.test(e.key);
          const isDecimalPoint = e.key === "." && !localValue.includes(".");
          const isMinusSign = e.key === "-" && localValue.length === 0;

          if (!allowedKeys.includes(e.key) && !isNumericKey && !isDecimalPoint && !isMinusSign) {
            e.preventDefault();
          }
          break;
      }
    }
  };

  /**
   * Increment or decrement the current value
   */
  const incrementValue = (delta: number) => {
    const currentNum = Number.parseFloat(localValue) || 0;
    const newNum = currentNum + delta;

    // Apply the same validation as normal input
    const parsedValue = parseInputValue(String(newNum));
    if (parsedValue !== null) {
      setLocalValue(String(newNum));
      onChange(parsedValue);
    }
  };

  const hasValidationError = hasError || !!validationError;

  return (
    <div className="inline-edit-numeric-container">
      <input
        ref={inputRef}
        type="text" // Use text instead of number for better control
        inputMode="decimal" // Hint for mobile keyboards
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        data-row-id={rowId}
        data-column-id={columnId}
        disabled={disabled}
        placeholder={isQuantity ? "0.00" : "0"}
        className={`
          inline-edit-numeric
          w-full
          px-2
          py-1
          border
          rounded
          text-sm
          text-right
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-transparent
          ${
            hasValidationError
              ? "border-red-500 bg-red-50 text-red-900 placeholder-red-400"
              : "border-gray-300 bg-white"
          }
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

      {/* Show field type hint */}
      {isQuantity && !hasValidationError && (
        <div className="text-xs text-gray-500 mt-1">Use ↑↓ arrows to adjust value</div>
      )}
    </div>
  );
};

// Memoize the component for performance optimization
export const NumericCellEditor = React.memo(NumericCellEditorComponent, (prevProps, nextProps) => {
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

NumericCellEditor.displayName = "NumericCellEditor";

export default NumericCellEditor;

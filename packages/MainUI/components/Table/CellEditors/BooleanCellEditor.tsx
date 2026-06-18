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
import type { CellEditorProps } from "../types/inlineEditing";
import { useKeyboardNavigation } from "../utils/keyboardNavigation";
import CheckIcon from "../../../../ComponentLibrary/src/assets/icons/check.svg";

const resolveBorderColor = (checked: boolean, hasError: boolean, accentColor: string): string => {
  if (checked) return accentColor;
  if (hasError) return "#ef4444";
  return "rgba(0,3,13,0.4)";
};

const convertToBoolean = (val: unknown): boolean => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const strVal = val.toLowerCase().trim();
    return strVal === "true" || strVal === "y" || strVal === "1" || strVal === "yes";
  }
  if (typeof val === "number") return val !== 0;
  return false;
};

/**
 * Checkbox/switch editor for boolean fields
 * Handles true/false value mapping and provides visual feedback for boolean states
 * Memoized for performance optimization
 */
const BooleanCellEditorComponent: React.FC<CellEditorProps> = ({
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
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState<boolean>(() => convertToBoolean(value));

  // Keyboard navigation hook
  const { handleKeyDown: handleNavigationKeyDown, setFocused } = useKeyboardNavigation(
    rowId || "",
    columnId || "",
    keyboardNavigationManager
  );

  // Auto-focus only when shouldAutoFocus is true
  useEffect(() => {
    if (checkboxRef.current && !disabled && shouldAutoFocus) {
      checkboxRef.current.focus();
      // Register this cell as focused
      setFocused();
    }
  }, [shouldAutoFocus, disabled, setFocused]);

  // Update local value when prop value changes
  useEffect(() => {
    // Convert various boolean representations to actual boolean
    const boolValue = convertToBoolean(value);
    setLocalValue(boolValue);
  }, [value]);

  /**
   * Convert boolean to the format expected by the backend
   * This might need to be adjusted based on the specific field requirements
   */
  const convertFromBoolean = (boolVal: boolean): unknown => {
    // Check if the field has specific boolean format requirements
    // For now, return the boolean value directly
    // This could be enhanced to return "Y"/"N" or other formats as needed
    return boolVal;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLocalValue(newValue);
    onChange(convertFromBoolean(newValue));
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
          checkboxRef.current?.blur();
          break;
        case "Escape":
          // This should be handled by navigation, but fallback to restore value
          e.preventDefault();
          setLocalValue(convertToBoolean(value));
          checkboxRef.current?.blur();
          break;
        case " ":
          // Space key toggles checkbox (default behavior)
          break;
        default:
          // Allow navigation keys (Tab/Arrow/Home/End) to pass through to browser/framework
          if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
            // Keep default behaviour so focus/navigation is not broken
            return;
          }
          // Prevent only other printable characters from affecting the checkbox
          // (e.key length === 1 indicates printable char in most browsers)
          if (e.key && e.key.length === 1) {
            e.preventDefault();
          }
          break;
      }
    }
  };

  // Tailwind's `checked:` variant is not reliably generated for this file
  // (JIT content-path issue), so the checked state is expressed via inline styles.
  const accentColor = hasError ? "#dc2626" : "#004ACA";
  const borderColor = resolveBorderColor(localValue, !!hasError, accentColor);
  const backgroundColor = localValue ? accentColor : "white";

  return (
    <div className="inline-edit-boolean-container flex items-center justify-center">
      <div className="relative flex items-center">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          data-row-id={rowId}
          data-column-id={columnId}
          disabled={disabled}
          style={{ backgroundColor, borderColor }}
          className={`
            inline-edit-checkbox
            min-w-4
            min-h-4
            w-4
            h-4
            rounded
            border-[1.67px]
            appearance-none
            focus:outline-none
            focus:ring-2
            focus:ring-offset-1
            ${hasError ? "focus:ring-red-500" : "focus:ring-blue-500"}
            ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-gray-500 cursor-pointer"}
          `}
          title={hasError ? "This field has validation errors" : field.name}
          aria-label={field.name}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${field.name}-error` : undefined}
        />
        {localValue && (
          <CheckIcon
            className="absolute top-0.5 left-0.5 w-3 h-3 pointer-events-none fill-white"
            data-testid="BooleanCellEditor__CheckIcon"
          />
        )}
      </div>
    </div>
  );
};

// Memoize the component for performance optimization
export const BooleanCellEditor = React.memo(BooleanCellEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.rowId === nextProps.rowId &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.field?.name === nextProps.field?.name
  );
});

BooleanCellEditor.displayName = "BooleanCellEditor";

export default BooleanCellEditor;

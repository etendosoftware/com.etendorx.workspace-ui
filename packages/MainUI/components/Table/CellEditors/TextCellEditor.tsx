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
import { generateAriaAttributes } from "../utils/accessibilityUtils";

/**
 * Text input editor for string fields
 * Provides focus management, keyboard navigation, and validation feedback
 * Memoized for performance optimization
 */
const TextCellEditorComponent: React.FC<CellEditorProps> = ({
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
  const [localValue, setLocalValue] = useState<string>(String(value || ""));
  const isUserTyping = useRef<boolean>(false);
  const hasInitialFocus = useRef<boolean>(false);

  // Keyboard navigation hook
  const { handleKeyDown: handleNavigationKeyDown, setFocused } = useKeyboardNavigation(
    rowId || "",
    columnId || "",
    keyboardNavigationManager
  );

  // Auto-focus only when shouldAutoFocus is true - prevents unwanted focus during scroll
  useEffect(() => {
    if (inputRef.current && !disabled && shouldAutoFocus && !hasInitialFocus.current) {
      hasInitialFocus.current = true;
      inputRef.current.focus();
      // Select all text for easy replacement
      inputRef.current.select();
      // Register this cell as focused
      setFocused();
    }
  }, [shouldAutoFocus, disabled, setFocused]); // Only focus when explicitly requested

  // Update local value when prop value changes - but ONLY if user is not currently typing
  // This prevents overwriting user input during typing
  useEffect(() => {
    if (!isUserTyping.current) {
      setLocalValue(String(value || ""));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isUserTyping.current = true;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    isUserTyping.current = false;
    onBlur();
  };

  const handleFocus = () => {
    // Register this cell as focused when it receives focus
    isUserTyping.current = true;
    setFocused();
  };

  // Generate ARIA attributes for accessibility
  const ariaAttributes = generateAriaAttributes.editableCell(
    field.name,
    field.name, // Using field name as label since field.label doesn't exist
    hasError,
    field.isMandatory || false,
    0, // Row index - would need to be passed from parent for accurate value
    0 // Column index - would need to be passed from parent for accurate value
  );

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle keyboard shortcuts
    switch (e.key) {
      case "Tab":
        // Prevent default tab behavior and use our navigation
        e.preventDefault();
        if (keyboardNavigationManager) {
          await handleNavigationKeyDown(e.nativeEvent);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (keyboardNavigationManager) {
          // Let navigation manager handle Enter (usually saves and moves to next row)
          await handleNavigationKeyDown(e.nativeEvent);
        } else {
          inputRef.current?.blur();
        }
        break;
      case "Escape":
        e.preventDefault();
        if (keyboardNavigationManager) {
          // Let navigation manager handle Escape (usually cancels editing)
          await handleNavigationKeyDown(e.nativeEvent);
        } else {
          setLocalValue(String(value || ""));
          inputRef.current?.blur();
        }
        break;
      default:
        // Allow normal typing - don't intercept regular keys
        break;
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      data-row-id={rowId}
      data-column-id={columnId}
      disabled={disabled}
      placeholder={`Enter ${field.name}...`}
      className={`
        inline-edit-input
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
        ${hasError ? "border-red-500 bg-red-50 text-red-900 placeholder-red-400" : "border-gray-300 bg-white"}
        ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "hover:border-gray-400"}
      `}
      title={hasError ? "This field has validation errors" : field.name}
      {...ariaAttributes}
    />
  );
};

// Memoize the component for performance optimization
export const TextCellEditor = React.memo(TextCellEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.rowId === nextProps.rowId &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.field?.name === nextProps.field?.name
  );
});

TextCellEditor.displayName = "TextCellEditor";

export default TextCellEditor;

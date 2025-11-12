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
  shouldAutoFocus = false
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState<boolean>(false);

  // Keyboard navigation hook
  const { handleKeyDown: handleNavigationKeyDown, setFocused } = useKeyboardNavigation(
    rowId || '',
    columnId || '',
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
   * Convert various boolean representations to actual boolean
   * Handles: true/false, "Y"/"N", "true"/"false", 1/0, etc.
   */
  const convertToBoolean = (val: unknown): boolean => {
    if (typeof val === 'boolean') {
      return val;
    }
    
    if (typeof val === 'string') {
      const strVal = val.toLowerCase().trim();
      return strVal === 'true' || strVal === 'y' || strVal === '1' || strVal === 'yes';
    }
    
    if (typeof val === 'number') {
      return val !== 0;
    }
    
    return false;
  };

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
        case 'Enter':
          // This should be handled by navigation, but fallback to blur
          e.preventDefault();
          checkboxRef.current?.blur();
          break;
        case 'Escape':
          // This should be handled by navigation, but fallback to restore value
          e.preventDefault();
          setLocalValue(convertToBoolean(value));
          checkboxRef.current?.blur();
          break;
        case ' ':
          // Space key toggles checkbox (default behavior)
          break;
        default:
          // Prevent other keys from affecting the checkbox
          e.preventDefault();
          break;
      }
    }
  };

  return (
    <div className="inline-edit-boolean-container flex items-center justify-center">
      <label className="inline-edit-boolean-label flex items-center cursor-pointer">
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
          className={`
            inline-edit-checkbox
            w-4
            h-4
            rounded
            border-2
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:ring-offset-1
            ${hasError 
              ? 'border-red-500 text-red-600 focus:ring-red-500' 
              : 'border-gray-300 text-blue-600'
            }
            ${disabled 
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
              : 'hover:border-gray-400 cursor-pointer'
            }
          `}
          title={hasError ? 'This field has validation errors' : field.name}
          aria-label={field.name}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${field.name}-error` : undefined}
        />
        
        {/* Optional label text */}
        <span className="ml-2 text-sm text-gray-700 select-none">
          {localValue ? 'Yes' : 'No'}
        </span>
      </label>
      
      {/* Visual indicator for the current state */}
      <div className="ml-2 text-xs text-gray-500">
        {localValue ? '✓' : '✗'}
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
    prevProps.field.name === nextProps.field.name
  );
});

BooleanCellEditor.displayName = 'BooleanCellEditor';

export default BooleanCellEditor;
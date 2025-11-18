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

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { CellEditorProps } from "../types/inlineEditing";
import type { RefListField } from "@workspaceui/api-client/src/api/types";
import { useKeyboardNavigation } from "../utils/keyboardNavigation";

/**
 * Dropdown editor for list/select fields using refList data
 * Handles option loading, display, and value mapping between display and stored values
 * Memoized for performance optimization
 */
const SelectCellEditorComponent: React.FC<CellEditorProps> = ({
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
  loadOptions,
  isLoadingOptions,
}) => {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [localValue, setLocalValue] = useState<string>(String(value || ""));
  const [dynamicOptions, setDynamicOptions] = useState<RefListField[]>([]);
  const [isLoadingDynamicOptions, setIsLoadingDynamicOptions] = useState(false);

  // Keyboard navigation hook
  const { handleKeyDown: handleNavigationKeyDown, setFocused } = useKeyboardNavigation(
    rowId || "",
    columnId || "",
    keyboardNavigationManager
  );

  // Auto-focus only when shouldAutoFocus is true
  useEffect(() => {
    if (selectRef.current && !disabled && shouldAutoFocus) {
      selectRef.current.focus();
      // Register this cell as focused
      setFocused();
    }
  }, [shouldAutoFocus, disabled, setFocused]);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(String(value || ""));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // For empty string, pass null to indicate no selection
    onChange(newValue === "" ? null : newValue);
  };

  const handleBlur = () => {
    onBlur();
  };

  const handleFocus = () => {
    // Register this cell as focused when it receives focus
    setFocused();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLSelectElement | HTMLInputElement>) => {
    // First try keyboard navigation
    const navigationHandled = await handleNavigationKeyDown(e.nativeEvent);

    if (!navigationHandled) {
      // Handle local keyboard events if navigation didn't handle them
      switch (e.key) {
        case "Enter":
          // This should be handled by navigation, but fallback to blur
          e.preventDefault();
          if ("blur" in e.target && typeof e.target.blur === "function") {
            e.target.blur();
          }
          break;
        case "Escape":
          // This should be handled by navigation, but fallback to restore value
          e.preventDefault();
          setLocalValue(String(value || ""));
          if ("blur" in e.target && typeof e.target.blur === "function") {
            e.target.blur();
          }
          break;
        default:
          // Allow normal dropdown navigation (arrow keys, etc.)
          break;
      }
    }
  };

  // Load options dynamically for TABLEDIR fields if needed
  useEffect(() => {
    const loadDynamicOptions = async () => {
      // Check if this field needs dynamic option loading
      if (loadOptions && field.type === "tabledir" && (!field.refList || field.refList.length === 0)) {
        setIsLoadingDynamicOptions(true);
        try {
          const options = await loadOptions(field);
          setDynamicOptions(options);
        } catch (error) {
          console.error(`[SelectCellEditor] Failed to load options for ${field.name}:`, error);
          setDynamicOptions([]);
        } finally {
          setIsLoadingDynamicOptions(false);
        }
      }
    };

    loadDynamicOptions();
  }, [field.name, field.type, field.refList, loadOptions]);

  // Combine static and dynamic options
  const options = useMemo(() => {
    const staticOptions = field.refList || [];
    const combinedOptions = [...staticOptions, ...dynamicOptions];
    return combinedOptions;
  }, [field.refList, dynamicOptions]);

  // Removed debugging logs to improve performance during scrolling

  // Check if we're loading options or if this is a TABLEDIR field with no options
  const isLoadingOrNoOptions =
    isLoadingDynamicOptions ||
    ((field.type === "tabledir" || field.referencedEntity) && options.length === 0 && !isLoadingDynamicOptions);

  // If we're loading options or this is a TABLEDIR field without options, render as text input
  if (isLoadingOrNoOptions) {
    return (
      <div className="inline-edit-tabledir-fallback">
        <input
          ref={selectRef as any}
          type="text"
          value={localValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            onChange(newValue === "" ? null : newValue);
          }}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          data-row-id={rowId}
          data-column-id={columnId}
          disabled={disabled}
          placeholder={isLoadingDynamicOptions ? `Loading ${field.name} options...` : `Enter ${field.name}...`}
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
          title={hasError ? "This field has validation errors (TABLEDIR fallback)" : `${field.name} (TABLEDIR)`}
          aria-label={`${field.name} (TABLEDIR)`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${field.name}-error` : undefined}
        />
        <div className="text-xs text-gray-500 mt-1">
          {isLoadingDynamicOptions ? "Loading options..." : "TABLEDIR field - options not loaded"}
        </div>
      </div>
    );
  }

  return (
    <select
      ref={selectRef}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      data-row-id={rowId}
      data-column-id={columnId}
      disabled={disabled}
      className={`
        inline-edit-select
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
        ${hasError ? "border-red-500 bg-red-50 text-red-900" : "border-gray-300 bg-white"}
        ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "hover:border-gray-400 cursor-pointer"}
      `}
      title={hasError ? "This field has validation errors" : field.name}
      aria-label={field.name}
      aria-invalid={hasError}
      aria-describedby={hasError ? `${field.name}-error` : undefined}>
      {/* Empty option for no selection */}
      <option value="">{field.isMandatory ? "Select an option..." : "(None)"}</option>

      {/* Render options from refList */}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}

      {/* If no options available, show a message */}
      {options.length === 0 && (
        <option value="" disabled>
          No options available (Field: {field.name}, Type: {field.type})
        </option>
      )}
    </select>
  );
};

// Memoize the component for performance optimization
export const SelectCellEditor = React.memo(SelectCellEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.rowId === nextProps.rowId &&
    prevProps.columnId === nextProps.columnId &&
    prevProps.field.name === nextProps.field.name &&
    JSON.stringify(prevProps.field.refList) === JSON.stringify(nextProps.field.refList)
  );
});

SelectCellEditor.displayName = "SelectCellEditor";

export default SelectCellEditor;

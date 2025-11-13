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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CellEditorProps } from "../types/inlineEditing";
import type { RefListField } from "@workspaceui/api-client/src/api/types";
import { FieldType } from "@workspaceui/api-client/src/api/types";
import { useKeyboardNavigation } from "../utils/keyboardNavigation";
import Menu from "@workspaceui/componentlibrary/src/components/Menu";

import Image from "next/image";
import ChevronDown from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import checkIconUrl from "@workspaceui/componentlibrary/src/assets/icons/check-circle-filled.svg?url";

/**
 * TABLEDIR cell editor that uses a dropdown similar to MultiSelect but for single selection
 * Handles option loading, display, and value mapping for TABLEDIR fields
 */
const TableDirCellEditorComponent: React.FC<CellEditorProps> = ({
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
  console.log("[TableDirCellEditor] RENDER START", {
    fieldName: field.name,
    value,
    disabled,
    hasRefList: !!field.refList,
    refListLength: field.refList?.length || 0,
  });

  const [localValue, setLocalValue] = useState<string>(String(value || ""));
  const [dynamicOptions, setDynamicOptions] = useState<RefListField[]>([]);
  const [isLoadingDynamicOptions, setIsLoadingDynamicOptions] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation hook
  const { handleKeyDown: handleNavigationKeyDown, setFocused } = useKeyboardNavigation(
    rowId || "",
    columnId || "",
    keyboardNavigationManager
  );

  // Auto-focus only when shouldAutoFocus is true
  useEffect(() => {
    if (wrapperRef.current && !disabled && shouldAutoFocus) {
      wrapperRef.current.focus();
      setFocused();
    }
  }, [shouldAutoFocus, disabled, setFocused]);

  // Update local value when prop value changes
  useEffect(() => {
    console.log("[TableDirCellEditor] value prop changed", {
      fieldName: field.name,
      newValue: value,
      oldLocalValue: localValue,
      willSetLocalValue: String(value || ""),
    });
    setLocalValue(String(value || ""));
  }, [value, field.name, localValue]);

  // Load options dynamically for TABLEDIR fields
  useEffect(() => {
    const loadDynamicOptions = async () => {
      console.log(`[TableDirCellEditor] Checking if should load options for ${field.name}`, {
        hasLoadOptions: !!loadOptions,
        fieldType: field.type,
        hasRefList: !!field.refList,
        refListLength: field.refList?.length || 0,
        shouldLoad: loadOptions && field.type === FieldType.TABLEDIR && (!field.refList || field.refList.length === 0),
      });

      if (loadOptions && field.type === FieldType.TABLEDIR && (!field.refList || field.refList.length === 0)) {
        setIsLoadingDynamicOptions(true);
        try {
          console.log(`[TableDirCellEditor] Loading options for ${field.name}`);
          const options = await loadOptions(field, searchTerm);
          console.log(`[TableDirCellEditor] Loaded ${options.length} options for ${field.name}`);
          setDynamicOptions(options);
        } catch (error) {
          console.error(`[TableDirCellEditor] Failed to load options for ${field.name}:`, error);
          setDynamicOptions([]);
        } finally {
          setIsLoadingDynamicOptions(false);
        }
      }
    };

    loadDynamicOptions();
  }, [field.name, field.type, field.refList, loadOptions, searchTerm]);

  // Combine static and dynamic options
  const options = useMemo(() => {
    const staticOptions = field.refList || [];
    const combinedOptions = [...staticOptions, ...dynamicOptions];
    return combinedOptions;
  }, [field.refList, dynamicOptions]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  // Find the current selected option
  const selectedOption = useMemo(() => {
    const found = options.find((opt) => String(opt.value) === localValue);
    console.log("[TableDirCellEditor] selectedOption memo recalculated", {
      fieldName: field.name,
      localValue,
      optionsCount: options.length,
      foundOption: found,
      allOptionValues: options.map((opt) => opt.value),
    });
    return found;
  }, [options, localValue, field.name]);

  // Display text for the input
  const displayText = useMemo(() => {
    console.log("[TableDirCellEditor] displayText memo recalculated", {
      fieldName: field.name,
      hasSelectedOption: !!selectedOption,
      selectedOptionLabel: selectedOption?.label,
      localValue,
      willReturn: selectedOption ? selectedOption.label : localValue || "",
    });

    if (selectedOption) {
      return selectedOption.label;
    }
    if (localValue && field.name?.includes("$_identifier")) {
      // If we have a value but no option, show the identifier if available
      const identifierKey = `${field.name.replace("$_identifier", "")}$_identifier`;
      return (field as any)[identifierKey] || localValue;
    }
    return localValue || "";
  }, [selectedOption, localValue, field]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      console.log("[TableDirCellEditor] handleSelect called", {
        optionValue,
        fieldName: field.name,
        willPassToOnChange: optionValue === "" ? null : optionValue,
        currentLocalValue: localValue,
        currentPropValue: value,
        optionsCount: options.length,
        selectedOptionBefore: options.find((opt) => String(opt.value) === localValue),
        willBeSelectedOption: options.find((opt) => String(opt.value) === optionValue),
      });

      // Update local value first
      setLocalValue(optionValue);

      // Call onChange with the new value
      const valueToSend = optionValue === "" ? null : optionValue;
      console.log("[TableDirCellEditor] Calling onChange with:", valueToSend);
      onChange(valueToSend);

      // Close menu and reset UI state
      setAnchorEl(null);
      setSearchTerm("");
      setHighlightedIndex(-1);

      console.log("[TableDirCellEditor] handleSelect completed, new localValue:", optionValue);
    },
    [onChange, field.name, localValue, value, options]
  );

  const handleClick = useCallback(() => {
    console.log("[TableDirCellEditor] handleClick called", {
      fieldName: field.name,
      disabled,
      currentAnchorEl: !!anchorEl,
      willOpen: !anchorEl && !disabled,
    });
    if (disabled) return;
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(wrapperRef.current);
    }
    setFocused();
  }, [anchorEl, disabled, setFocused, field.name]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      // First try keyboard navigation
      const navigationHandled = await handleNavigationKeyDown(e.nativeEvent);

      if (!navigationHandled) {
        // Handle local keyboard events
        switch (e.key) {
          case "Enter":
            e.preventDefault();
            if (anchorEl && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
              handleSelect(filteredOptions[highlightedIndex].value);
            } else if (!anchorEl) {
              setAnchorEl(wrapperRef.current);
            }
            break;
          case "Escape":
            e.preventDefault();
            if (anchorEl) {
              setAnchorEl(null);
              setSearchTerm("");
              setHighlightedIndex(-1);
            } else {
              setLocalValue(String(value || ""));
              onBlur();
            }
            break;
          case "ArrowDown":
            e.preventDefault();
            if (!anchorEl) {
              setAnchorEl(wrapperRef.current);
            } else {
              setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
            }
            break;
          case "ArrowUp":
            e.preventDefault();
            if (anchorEl) {
              setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
            }
            break;
          default:
            break;
        }
      }
    },
    [handleNavigationKeyDown, anchorEl, highlightedIndex, filteredOptions, handleSelect, value, onBlur]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Only blur if focus is moving outside the component
      if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
        setAnchorEl(null);
        setSearchTerm("");
        setHighlightedIndex(-1);
        onBlur();
      }
    },
    [onBlur]
  );

  const handleOptionMouseDown = useCallback(
    (e: React.MouseEvent, optionValue: string) => {
      e.stopPropagation();
      e.preventDefault();
      console.log("[TableDirCellEditor] Option mousedown", { optionValue, fieldName: field.name });
      handleSelect(optionValue);
    },
    [handleSelect, field.name]
  );

  const handleOptionMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (anchorEl && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [anchorEl]);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSearchTerm("");
    setHighlightedIndex(-1);
  }, []);

  const isLoading = isLoadingDynamicOptions || (isLoadingOptions && isLoadingOptions(field.name));

  return (
    <div ref={wrapperRef} className="relative w-full" onBlur={handleBlur} tabIndex={-1}>
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          inline-edit-tabledir
          w-full
          px-2
          py-1
          border
          rounded
          text-sm
          cursor-pointer
          flex
          items-center
          justify-between
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:border-transparent
          ${hasError ? "border-red-500 bg-red-50 text-red-900" : "border-gray-300 bg-white"}
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "hover:border-gray-400"}
          ${anchorEl ? "ring-2 ring-blue-500 border-blue-500" : ""}
        `}
        title={hasError ? "This field has validation errors" : field.name}
        aria-label={field.name}
        aria-invalid={hasError}
        aria-expanded={!!anchorEl}
        aria-haspopup="listbox"
        role="combobox">
        <span className="truncate flex-1">
          {isLoading ? "Loading..." : displayText || (field.isMandatory ? "Select an option..." : "(None)")}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${anchorEl ? "rotate-180" : ""}`} />
      </div>

      <Menu
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        className="min-w-[200px] max-h-60 overflow-hidden"
        offsetY={4}>
        <div className="p-2">
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={`Search ${field.name}...`}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <ul className="overflow-y-auto max-h-40" role="listbox">
          {/* Empty option */}
          {!field.isMandatory && (
            <li
              onMouseDown={(e) => handleOptionMouseDown(e, "")}
              onMouseEnter={() => handleOptionMouseEnter(-1)}
              className={`
                px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                ${highlightedIndex === -1 ? "bg-blue-50" : ""}
                hover:bg-blue-50
              `}
              role="option"
              aria-selected={localValue === ""}>
              <span className="text-gray-500">(None)</span>
              {localValue === "" && <Image src={checkIconUrl} alt="Selected" width={16} height={16} />}
            </li>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                onMouseDown={(e) => handleOptionMouseDown(e, option.value)}
                onMouseEnter={() => handleOptionMouseEnter(index)}
                className={`
                  px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                  ${highlightedIndex === index ? "bg-blue-50" : ""}
                  ${String(option.value) === localValue ? "bg-blue-50 font-medium" : ""}
                  hover:bg-blue-50
                `}
                role="option"
                aria-selected={String(option.value) === localValue}>
                <span className="truncate">{option.label}</span>
                {String(option.value) === localValue && (
                  <Image src={checkIconUrl} alt="Selected" width={16} height={16} />
                )}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-gray-500">{isLoading ? "Loading options..." : "No options found"}</li>
          )}
        </ul>
      </Menu>
    </div>
  );
};

// Memoize the component for performance optimization
export const TableDirCellEditor = React.memo(TableDirCellEditorComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.hasError === nextProps.hasError &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.field.name === nextProps.field.name &&
    prevProps.shouldAutoFocus === nextProps.shouldAutoFocus
  );
});

TableDirCellEditor.displayName = "TableDirCellEditor";

export default TableDirCellEditor;

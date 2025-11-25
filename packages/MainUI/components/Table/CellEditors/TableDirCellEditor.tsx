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
  const [localValue, setLocalValue] = useState<string>(String(value || ""));
  const [dynamicOptions, setDynamicOptions] = useState<RefListField[]>([]);
  const [isLoadingDynamicOptions, setIsLoadingDynamicOptions] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedForCurrentValue = useRef<string | null>(null);
  const loadOptionsRef = useRef(loadOptions);
  const fieldNameRef = useRef(field.name);

  // Update refs when props change to avoid triggering effects
  useEffect(() => {
    loadOptionsRef.current = loadOptions;
    fieldNameRef.current = field.name;
  });

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
    const newValue = String(value || "");
    setLocalValue(newValue);
    // Reset the loaded flag when value changes from outside
    if (newValue !== hasLoadedForCurrentValue.current) {
      hasLoadedForCurrentValue.current = null;
    }
  }, [value]);

  // Load initial options ONCE when component mounts IF we have a value but no display label
  // This handles the case where we're editing an existing row and need to show the label
  useEffect(() => {
    // Skip if already loaded for this value
    if (hasLoadedForCurrentValue.current === localValue) {
      return;
    }

    // Skip if no value
    if (!localValue) {
      hasLoadedForCurrentValue.current = "";
      return;
    }

    // Check if we have a display label already
    const hasIdentifier =
      (field.refList && field.refList.length > 0) ||
      dynamicOptions.some((opt) => String(opt.id) === localValue || String(opt.value) === localValue);

    // Also check for identifier fields
    const identifierFieldKey = field.inputName || field.hqlName || field.columnName || field.name;
    const identifierKey = `${identifierFieldKey}$_identifier`;
    const hasIdentifierField = !!(field as unknown as Record<string, unknown>)[identifierKey];

    // If we have a way to display the value, don't load options yet
    if (hasIdentifier || hasIdentifierField) {
      hasLoadedForCurrentValue.current = localValue;
      return;
    }

    // Load options for this value
    const loadInitialOptions = async () => {
      const loadOptionsFn = loadOptionsRef.current;

      if (!loadOptionsFn || field.type !== FieldType.TABLEDIR) {
        return;
      }

      setIsLoadingDynamicOptions(true);
      try {
        const loadedOptions = await loadOptionsFn(field, "");
        setDynamicOptions(loadedOptions);
        hasLoadedForCurrentValue.current = localValue;
      } catch (error) {
        console.error(`[TableDirCellEditor] Failed to load initial options for ${fieldNameRef.current}:`, error);
        setDynamicOptions([]);
      } finally {
        setIsLoadingDynamicOptions(false);
      }
    };

    loadInitialOptions();
  }, [localValue]); // Only run when localValue changes

  // Load options only when dropdown opens or search term changes
  // IMPORTANT: This effect should NOT run on scroll, resize, or other re-renders
  // We use refs to avoid re-triggering when loadOptions or field object changes
  useEffect(() => {
    // Only load options when:
    // 1. Dropdown is explicitly opened (anchorEl is set)
    // 2. User is actively searching (searchTerm changes)
    if (!anchorEl && !searchTerm) {
      return;
    }

    const loadDynamicOptions = async () => {
      const loadOptionsFn = loadOptionsRef.current;

      if (!loadOptionsFn || field.type !== FieldType.TABLEDIR) {
        return;
      }

      // Skip if we have static options
      if (field.refList && field.refList.length > 0) {
        return;
      }

      setIsLoadingDynamicOptions(true);
      try {
        const loadedOptions = await loadOptionsFn(field, searchTerm);
        setDynamicOptions(loadedOptions);
      } catch (error) {
        console.error(`[TableDirCellEditor] Failed to load options for ${fieldNameRef.current}:`, error);
        setDynamicOptions([]);
      } finally {
        setIsLoadingDynamicOptions(false);
      }
    };

    loadDynamicOptions();
  }, [anchorEl, searchTerm]); // Only depend on anchorEl and searchTerm - NOT on field or loadOptions

  // Get restricted entries from field (set by callouts)
  // IMPORTANT: Use inputName to match how entries are stored by callouts (e.g., "inpcBpartnerId")
  // Callouts use inputName for payload fields, not hqlName
  const restrictedEntries = useMemo(() => {
    const fieldKey = field.inputName || field.hqlName || field.columnName || field.name;
    const entriesKey = `${fieldKey}$_entries`;
    return ((field as unknown as Record<string, unknown>)[entriesKey] || []) as RefListField[];
  }, [field]);

  // Combine static, dynamic, and restricted options (from callouts)
  const options = useMemo(() => {
    const staticOptions = field.refList || [];

    // Combine all options: static + dynamic + restricted entries
    // Restricted entries are values set by callouts that may not be in the datasource
    const allOptions = [...staticOptions, ...dynamicOptions, ...restrictedEntries];

    // If we have a current value with an identifier but it's not in the options,
    // create a temporary option for it so it appears in the dropdown
    if (localValue) {
      const valueExists = allOptions.some((opt) => String(opt.id) === localValue || String(opt.value) === localValue);

      if (!valueExists) {
        // Try to get the identifier for this value
        const identifierFieldKey = field.inputName || field.hqlName || field.columnName || field.name;
        const identifierKey = `${identifierFieldKey}$_identifier`;
        const identifierFromField = (field as unknown as Record<string, unknown>)[identifierKey];
        const directIdentifier = (field as unknown as Record<string, unknown>)._identifier;
        const identifier = (identifierFromField || directIdentifier) as string | undefined;

        // If we have an identifier, create a temporary option
        if (identifier) {
          allOptions.push({
            id: localValue,
            value: localValue,
            label: identifier,
          });
        }
      }
    }

    // Remove duplicates by id
    const uniqueOptions = allOptions.filter(
      (opt, index, self) => index === self.findIndex((o) => String(o.id) === String(opt.id))
    );

    return uniqueOptions;
  }, [field.refList, dynamicOptions, restrictedEntries, localValue, field]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  // Find the current selected option
  const selectedOption = useMemo(() => {
    // Try to find by id first (preferred), then by value
    return options.find((opt) => String(opt.id) === localValue || String(opt.value) === localValue);
  }, [options, localValue]);

  // Display text for the input
  const displayText = useMemo(() => {
    // If we have a selected option, use its label
    if (selectedOption) {
      return selectedOption.label;
    }

    // If no option found but we have an identifier from the row data, use it
    // This handles cases where callouts set values but options aren't loaded yet
    // IMPORTANT: Use inputName to match how identifiers are stored (same as entries)
    const identifierFieldKey = field.inputName || field.hqlName || field.columnName || field.name;
    const identifierKey = `${identifierFieldKey}$_identifier`;
    const identifierFromField = (field as unknown as Record<string, unknown>)[identifierKey];

    if (identifierFromField) {
      return identifierFromField as string;
    }

    // Also check if the field itself has a _identifier property (from server data)
    const directIdentifier = (field as unknown as Record<string, unknown>)._identifier;
    if (directIdentifier && typeof directIdentifier === "string") {
      return directIdentifier;
    }

    // Fallback to the raw value (will show UUID if no identifier found)
    return localValue || "";
  }, [selectedOption, localValue, field]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      // Find the selected option to get its complete data
      const selectedOption = options.find((opt) => String(opt.value) === optionValue || String(opt.id) === optionValue);

      // Get the ID to send - prefer id over value
      const realId = selectedOption?.id || selectedOption?.value || optionValue;
      const valueToSend = optionValue === "" ? null : realId;

      // Update local value to the ID (for consistency with what we send to onChange)
      setLocalValue(realId);

      // Pass the entire selected option to onChange
      // This allows the parent to access all fields including product$id, bpid, etc.
      onChange(valueToSend, selectedOption as Record<string, unknown> | undefined);

      // Close menu and reset UI state
      setAnchorEl(null);
      setSearchTerm("");
      setHighlightedIndex(-1);
    },
    [onChange, options]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(comboboxRef.current);
    }
    setFocused();
  }, [anchorEl, disabled, setFocused]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
  }, []);

  /**
   * Handle Enter key press
   */
  const handleEnterKey = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      if (anchorEl && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (!anchorEl) {
        setAnchorEl(comboboxRef.current);
      }
    },
    [anchorEl, highlightedIndex, filteredOptions, handleSelect]
  );

  /**
   * Handle Escape key press
   */
  const handleEscapeKey = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      if (anchorEl) {
        setAnchorEl(null);
        setSearchTerm("");
        setHighlightedIndex(-1);
      } else {
        setLocalValue(String(value || ""));
        onBlur();
      }
    },
    [anchorEl, value, onBlur]
  );

  /**
   * Handle ArrowDown key press
   */
  const handleArrowDownKey = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      if (!anchorEl) {
        setAnchorEl(comboboxRef.current);
      } else {
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
    },
    [anchorEl, filteredOptions.length]
  );

  /**
   * Handle ArrowUp key press
   */
  const handleArrowUpKey = useCallback(
    (e: React.KeyboardEvent) => {
      e.preventDefault();
      if (anchorEl) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
    },
    [anchorEl, filteredOptions.length]
  );

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      // First try keyboard navigation
      const navigationHandled = await handleNavigationKeyDown(e.nativeEvent);

      if (navigationHandled) {
        return;
      }

      // Handle local keyboard events
      switch (e.key) {
        case "Enter":
          handleEnterKey(e);
          break;
        case "Escape":
          handleEscapeKey(e);
          break;
        case "ArrowDown":
          handleArrowDownKey(e);
          break;
        case "ArrowUp":
          handleArrowUpKey(e);
          break;
        default:
          break;
      }
    },
    [handleNavigationKeyDown, handleEnterKey, handleEscapeKey, handleArrowDownKey, handleArrowUpKey]
  );

  // Prevent Menu's useClickOutside from closing when clicking on combobox
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (comboboxRef.current?.contains(e.target as Node)) {
        e.stopPropagation();
      }
    };

    if (anchorEl) {
      document.addEventListener("mousedown", handleMouseDown, true);
      return () => document.removeEventListener("mousedown", handleMouseDown, true);
    }
  }, [anchorEl]);

  const handleOptionMouseDown = useCallback(
    (e: React.MouseEvent, optionValue: string) => {
      e.stopPropagation();
      e.preventDefault();
      handleSelect(optionValue);
    },
    [handleSelect]
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
    // Only call onBlur if focus is not on the combobox button
    if (document.activeElement !== wrapperRef.current) {
      onBlur();
    }
  }, [onBlur]);

  const isLoading = isLoadingDynamicOptions || isLoadingOptions?.(field.name);

  /**
   * Get the placeholder text for the combobox
   */
  const getPlaceholderText = (): string => {
    if (field.isMandatory) {
      return "Select an option...";
    }
    return "(None)";
  };

  /**
   * Get the display text for the combobox
   */
  const getComboboxDisplayText = (): string => {
    if (isLoading) {
      return "Loading...";
    }
    return displayText || getPlaceholderText();
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-full min-w-0 box-border">
      <div
        ref={comboboxRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`
          inline-edit-tabledir
          w-full
          max-w-full
          min-w-0
          box-border
          px-2
          py-1
          border
          rounded
          text-sm
          cursor-pointer
          flex
          items-center
          justify-between
          overflow-hidden
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
        aria-controls="tabledir-listbox"
        // biome-ignore lint/a11y/useSemanticElements: Custom combobox with search requires div not select
        role="combobox"
      >
        <span className="truncate flex-1 min-w-0">{getComboboxDisplayText()}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${anchorEl ? "rotate-180" : ""}`}
          data-testid={"ChevronDown__" + field.id}
        />
      </div>
      <Menu
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        className="min-w-[200px] max-h-60 overflow-hidden"
        offsetY={4}
        data-testid={"Menu__" + field.id}>
        <div className="p-2">
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={handleSearchChange}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder={`Search ${field.name}...`}
            className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: Custom listbox with search requires div not select */}
        <div id="tabledir-listbox" className="overflow-y-auto max-h-40" role="listbox" tabIndex={-1}>
          {/* Empty option */}
          {!field.isMandatory && (
            <div
              onMouseDown={(e) => handleOptionMouseDown(e, "")}
              onMouseEnter={() => handleOptionMouseEnter(-1)}
              className={`
                px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                ${highlightedIndex === -1 ? "bg-blue-50" : ""}
                hover:bg-blue-50
              `}
              // biome-ignore lint/a11y/useSemanticElements: Custom option with rich content requires div not option
              role="option"
              aria-selected={localValue === ""}
              tabIndex={-1}>
              <span className="text-gray-500">(None)</span>
              {localValue === "" && (
                <Image src={checkIconUrl} alt="Selected" width={16} height={16} data-testid={"Image__" + field.id} />
              )}
            </div>
          )}

          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const isSelected = String(option.id) === localValue || String(option.value) === localValue;
              return (
                <div
                  key={option.id || option.value}
                  onMouseDown={(e) => handleOptionMouseDown(e, option.value)}
                  onMouseEnter={() => handleOptionMouseEnter(index)}
                  className={`
                    px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                    ${highlightedIndex === index ? "bg-blue-50" : ""}
                    ${isSelected ? "bg-blue-50 font-medium" : ""}
                    hover:bg-blue-50
                  `}
                  // biome-ignore lint/a11y/useSemanticElements: Custom option with rich content requires div not option
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}>
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Image
                      src={checkIconUrl}
                      alt="Selected"
                      width={16}
                      height={16}
                      data-testid={"Image__" + field.id}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              {isLoading ? "Loading options..." : "No options found"}
            </div>
          )}
        </div>
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
    prevProps.field?.name === nextProps.field?.name &&
    prevProps.shouldAutoFocus === nextProps.shouldAutoFocus
  );
});

TableDirCellEditor.displayName = "TableDirCellEditor";

export default TableDirCellEditor;

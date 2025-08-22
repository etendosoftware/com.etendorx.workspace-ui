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

import { useTranslation } from "@/hooks/useTranslation";
import {
  handleKeyboardActivation,
  useClickOutside,
  useFocusHandler,
  useHoverHandlers,
  useInfiniteScroll,
  useKeyboardNavigation,
  useOpenDropdownEffect,
  useSearchHandler,
  useSearchTermHandler,
  type Option,
} from "@/utils/selectorUtils";
import Image from "next/image";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import checkIconUrl from "../../../../../../ComponentLibrary/src/assets/icons/check-circle-filled.svg?url";
import ChevronDown from "../../../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import closeIconUrl from "../../../../../../ComponentLibrary/src/assets/icons/x.svg?url";

const FOCUS_STYLES = "focus:outline-none focus:ring-2 focus:ring-dynamic-light";
const BASE_TRANSITION = "transition-colors outline-none";
const LIST_ITEM_BASE = "px-4 py-3 text-sm";
const TEXT_MUTED = "text-baseline-60";
const ICON_SIZE = "w-5 h-5";
const HOVER_TEXT_COLOR = "hover:text-baseline-80";

interface MultiSelectOption extends Option {}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onSearch?: (term: string) => void;
  onFocus?: () => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  placeholder?: string;
  maxHeight?: number;
}

const OptionItem = memo(
  ({
    id,
    label,
    index,
    isSelected,
    isHighlighted,
    onOptionClick,
    onMouseEnter,
  }: {
    id: string;
    label: string;
    index: number;
    isSelected: boolean;
    isHighlighted: boolean;
    onOptionClick: (id: string) => void;
    onMouseEnter: (index: number) => void;
  }) => (
    <li
      aria-selected={isSelected}
      onClick={() => onOptionClick(id)}
      onKeyDown={(e) => handleKeyboardActivation(e, () => onOptionClick(id))}
      onMouseEnter={() => onMouseEnter(index)}
      className={`${LIST_ITEM_BASE} cursor-pointer flex items-center justify-between ${FOCUS_STYLES} focus:bg-baseline-10
      ${isHighlighted ? "bg-baseline-10" : ""}
      ${isSelected ? "bg-baseline-10 font-medium" : ""}
      hover:bg-baseline-10`}>
      <span className={`truncate mr-2 ${isSelected ? "text-dynamic-dark" : "text-baseline-90"}`}>{label}</span>
      {isSelected && (
        <Image
          src={checkIconUrl}
          alt="Selected Item"
          className="fade-in-left flex-shrink-0"
          height={16}
          width={16}
          data-testid="Image__cb81f7"
        />
      )}
    </li>
  )
);

OptionItem.displayName = "OptionItem";

function MultiSelectCmp({
  options,
  selectedValues,
  onSelectionChange,
  onSearch,
  onFocus,
  onLoadMore,
  loading = false,
  hasMore = true,
  placeholder = "Select options...",
  maxHeight = 240,
}: MultiSelectProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isHovering, setIsHovering] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const handleSearchChange = useSearchHandler(onSearch);

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const selectedLabels = useMemo(() => {
    return options.filter((option) => selectedValues.includes(option.id)).map((option) => option.label);
  }, [options, selectedValues]);

  const displayText = useMemo(() => {
    if (selectedLabels.length === 0) return placeholder;
    if (selectedLabels.length === 1) return selectedLabels[0];
    return `${selectedLabels.length} selected`;
  }, [selectedLabels, placeholder]);

  const handleSelect = useCallback(
    (id: string) => {
      const newSelection = selectedValues.includes(id)
        ? selectedValues.filter((value) => value !== id)
        : [...selectedValues, id];
      onSelectionChange(newSelection);
    },
    [selectedValues, onSelectionChange]
  );

  const handleOptionClick = useCallback(
    (id: string) => {
      handleSelect(id);
    },
    [handleSelect]
  );

  const handleOptionMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index);
  }, []);

  const handleKeyDown = useKeyboardNavigation(
    filteredOptions,
    highlightedIndex,
    setHighlightedIndex,
    (option) => handleSelect(option.id),
    () => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }, []);

  const handleClick = useCallback(() => {
    const wasOpen = isOpen;
    setIsOpen(!wasOpen);

    // Load options when opening for the first time
    if (!wasOpen && options.length === 0 && onFocus) {
      onFocus();
    }
  }, [isOpen, options.length, onFocus]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectionChange([]);
    },
    [onSelectionChange]
  );

  const { handleMouseEnter, handleMouseLeave } = useHoverHandlers(setIsHovering);

  const handleScroll = useInfiniteScroll(listRef, loading, hasMore, onLoadMore);

  const handleFocus = useFocusHandler(onFocus);

  useClickOutside(wrapperRef, setIsOpen);

  const handleSetSearchTerm = useSearchTermHandler(handleSearchChange, setSearchTerm);

  useOpenDropdownEffect(isOpen, setSearchTerm, setHighlightedIndex, searchInputRef);

  const renderedOptions = useMemo(() => {
    if (filteredOptions.length > 0) {
      return filteredOptions.map(({ id, label }, index) => (
        <OptionItem
          key={id}
          id={id}
          label={label}
          index={index}
          isSelected={selectedValues.includes(id)}
          isHighlighted={highlightedIndex === index}
          onOptionClick={handleOptionClick}
          onMouseEnter={handleOptionMouseEnter}
          data-testid="OptionItem__cb81f7"
        />
      ));
    }
    return <li className={`${LIST_ITEM_BASE} ${TEXT_MUTED}`}>{t("multiselect.noOptionsFound")}</li>;
  }, [filteredOptions, highlightedIndex, selectedValues, handleOptionClick, handleOptionMouseEnter, t]);

  return (
    <div ref={wrapperRef} className="relative w-full font-['Inter']" onBlur={handleBlur} tabIndex={-1}>
      <div
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivation(e, handleClick)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`w-full flex items-center justify-between px-3 py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 ${FOCUS_STYLES}
          ${isOpen ? "rounded border-b-0 border-dynamic-main ring-2 ring-dynamic-light" : "border-baseline-40"} 
           text-baseline-20 cursor-pointer hover:border-baseline-60
          ${BASE_TRANSITION}`}>
        <span
          className={`text-sm truncate max-w-[calc(100%-40px)] ${selectedLabels.length > 0 ? "text-baseline-90 font-medium" : "text-baseline-50"}`}>
          {displayText}
        </span>
        <div className="flex items-center flex-shrink-0 ml-2">
          {selectedLabels.length > 0 && (isHovering || isOpen) && (
            <button
              type="button"
              onClick={handleClear}
              onKeyDown={(e) => handleKeyboardActivation(e, () => handleClear(e as unknown as React.MouseEvent))}
              className={`mr-1 ${TEXT_MUTED} ${HOVER_TEXT_COLOR} transition-opacity opacity-100 ${FOCUS_STYLES} rounded`}
              aria-label={t("multiselect.clearSelection")}>
              <Image src={closeIconUrl} alt="Clear" height={16} width={16} data-testid="Image__cb81f7" />
            </button>
          )}
          <ChevronDown
            fill="currentColor"
            className={`${ICON_SIZE} ${TEXT_MUTED} transition-transform ${isOpen ? "rotate-180" : ""}`}
            data-testid="ChevronDown__cb81f7"
          />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white rounded shadow-lg overflow-hidden border-1 border-transparent-neutral-10">
          <div className="p-2">
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={handleSetSearchTerm}
              onKeyDown={handleKeyDown}
              placeholder={t("multiselect.searchPlaceholder")}
              className="w-full p-2 text-sm border border-baseline-30 rounded focus:outline-none focus:border-dynamic-main focus:ring-1 focus:ring-dynamic-light"
              aria-label={t("multiselect.searchOptions")}
              onFocus={handleFocus}
            />
          </div>
          <ul
            ref={listRef}
            className="overflow-y-auto focus:outline-none"
            style={{ maxHeight: `${maxHeight}px` }}
            onScroll={handleScroll}>
            {renderedOptions}
            {loading && hasMore && (
              <li className={`${LIST_ITEM_BASE} ${TEXT_MUTED} text-center`}>{t("multiselect.loadingOptions")}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

const MultiSelect = memo(MultiSelectCmp);
export default MultiSelect;
export { MultiSelect };
export type { MultiSelectProps, MultiSelectOption };

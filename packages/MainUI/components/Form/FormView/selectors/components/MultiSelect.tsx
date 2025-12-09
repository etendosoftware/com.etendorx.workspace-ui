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

import {
  handleKeyboardActivation,
  useInfiniteScroll,
  useKeyboardNavigation,
  useClickOutside,
  type Option,
} from "@/utils/selectorUtils";
import Image from "next/image";
import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import checkIconUrl from "../../../../../../ComponentLibrary/src/assets/icons/check-circle-filled.svg?url";
import ChevronDown from "../../../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import closeIconUrl from "../../../../../../ComponentLibrary/src/assets/icons/x.svg?url";
import { useTranslation } from "@/hooks/useTranslation";
import { DropdownPortal } from "./DropdownPortal";
import { useDebouncedCallback } from "../../../../Table/utils/performanceOptimizations";

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
  enableTextFilterLogic?: boolean;
}

const OptionItem = memo(
  ({
    id,
    label,
    isSelected,
    isHighlighted,
    onSelect,
  }: {
    id: string;
    label: string;
    isSelected: boolean;
    isHighlighted: boolean;
    onSelect: (id: string) => void;
  }) => (
    <li
      aria-selected={isSelected}
      onClick={() => onSelect(id)}
      onKeyDown={(e) => handleKeyboardActivation(e, () => onSelect(id))}
      className={`${LIST_ITEM_BASE} cursor-pointer flex items-center justify-between ${FOCUS_STYLES} 
        ${isHighlighted ? "bg-baseline-10" : ""} 
        ${isSelected ? "bg-baseline-10 font-medium" : ""} hover:bg-baseline-10`}>
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

const MultiSelect = memo(function MultiSelectCmp({
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
  enableTextFilterLogic = false,
}: MultiSelectProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [internalOptions, setInternalOptions] = useState<MultiSelectOption[]>([]);
  const [isFetchingInitial, setIsFetchingInitial] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const handleOnSearch = useCallback((term: string) => {
    onSearch?.(term);
  }, [onSearch]);

  // Debounce the search callback
  const debouncedSearch = useDebouncedCallback(handleOnSearch, 500);

  // Filtrado
  const filteredOptions = useMemo(() => {
    let termToFilter = searchTerm;
    if (enableTextFilterLogic) {
      // Extract the last part of the logical expression
      const parts = searchTerm.split(/ OR | or /);
      const lastPart = parts[parts.length - 1] || "";
      
      // If the last part starts with ==, do not filter the dropdown
      if (lastPart.trim().startsWith("==")) {
        return internalOptions;
      }
      
      // Remove '==' prefix if present (though the above check handles the == case, 
      // we might want to support filtering if they type "==SomeText" but usually == implies exact match selection)
      // Based on requirement: "si se pone por ejemplo ==ETMETA_Cancel no deberia filtrar por a lista dentro del selector"
      // So if it starts with ==, we show all options.
      
      termToFilter = lastPart.trim();
    }
    return internalOptions.filter((o) => o.label.toLowerCase().includes(termToFilter.toLowerCase()));
  }, [internalOptions, searchTerm, enableTextFilterLogic]);

  const selectedLabels = useMemo(
    () => internalOptions.filter((o) => selectedValues.includes(o.id)).map((o) => o.label),
    [internalOptions, selectedValues]
  );

  const displayText = useMemo(() => {
    if (!selectedLabels.length) return placeholder;
    if (selectedLabels.length === 1) return selectedLabels[0];
    return `${selectedLabels.length} selected`;
  }, [selectedLabels, placeholder]);

  const handleSelect = useCallback(
    (id: string) => {
      if (enableTextFilterLogic) {
        const option = internalOptions.find((o) => o.id === id);
        if (option) {
          const label = option.label;
          // Escape special characters in label for regex
          const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const token = `==${label}`;
          
          // Check if the current search term ends with a logical operator
          // This allows users to build queries like "==A OR ==B" by typing " OR " and then selecting B
          // But if they just select B without typing an operator, it replaces the current value (Single Select behavior)
          const hasTrailingOperator = /\s+(OR|AND|\||&)\s*$/i.test(searchTerm);

          if (hasTrailingOperator) {
             setSearchTerm(`${searchTerm}${token}`);
             debouncedSearch(`${searchTerm}${token}`);
          } else {
             setSearchTerm(token);
             debouncedSearch(token);
          }
          
          // Keep dropdown open if we appended (building query), close if we replaced (selection done)?
          // User said "si selecciono por segunda vez... intercambiar". 
          // If I replace, I probably want to see the result.
          // Let's close it to mimic single select feel if we replaced.
          if (!hasTrailingOperator) {
            setIsOpen(false);
          }
          setHighlightedIndex(-1);
          // Don't call onSelectionChange, rely on text search
        }
      } else {
        const newSelection = selectedValues.includes(id)
          ? selectedValues.filter((v) => v !== id)
          : [...selectedValues, id];
        onSelectionChange(newSelection);
        setIsOpen(false);
        setHighlightedIndex(-1);
        setSearchTerm("");
      }
    },
    [selectedValues, onSelectionChange, enableTextFilterLogic, internalOptions, searchTerm, debouncedSearch]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectionChange([]);
      // Close dropdown when clearing selection
      setIsOpen(false);
      setSearchTerm("");
      if (enableTextFilterLogic) {
        debouncedSearch("");
      }
    },
    [onSelectionChange, enableTextFilterLogic, debouncedSearch]
  );

  const handleClick = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setIsFetchingInitial(true);
        onFocus?.();
      }
      return !prev;
    });
  }, [onFocus]);

  const handleInputClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
    setIsFetchingInitial(true);
    onFocus?.();
  }, [onFocus]);

  const handleKeyDown = useKeyboardNavigation(
    filteredOptions,
    highlightedIndex,
    setHighlightedIndex,
    (o) => handleSelect(o.id),
    () => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  );

  const clickOutsideRefs = useMemo(() => [portalRef], [portalRef]);
  useClickOutside(
    wrapperRef as React.RefObject<HTMLDivElement>,
    () => setIsOpen(false),
    clickOutsideRefs as React.RefObject<HTMLElement>[]
  );



  const handleSetSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      debouncedSearch(term);
      if (!isOpen) {
        setIsOpen(true);
        setIsFetchingInitial(true);
        onFocus?.();
      }
    },
    [debouncedSearch, isOpen, onFocus]
  );

  const handleScroll = useInfiniteScroll(listRef as React.RefObject<HTMLUListElement>, loading, hasMore, onLoadMore);

  // Actualizar opciones cuando llegan props
  useEffect(() => {
    setInternalOptions(options);
    if (options.length > 0 && !loading) setIsFetchingInitial(false);
  }, [options, loading]);

  const showSkeleton = isFetchingInitial && loading;

  const SKELETON_IDS = ["skeleton-item-1", "skeleton-item-2", "skeleton-item-3"];

  const renderedOptions = useMemo(() => {
    if (showSkeleton) {
      return SKELETON_IDS.map((id, index) => (
        <li key={id} className={`${LIST_ITEM_BASE} pointer-events-none`}>
          <div className="flex items-center gap-3 py-1">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + index * 10}%` }} />
          </div>
        </li>
      ));
    }

    if (filteredOptions.length > 0) {
      return filteredOptions.map((option, index) => (
        <OptionItem
          key={option.id}
          id={option.id}
          label={option.label}
          isSelected={selectedValues.includes(option.id)}
          isHighlighted={highlightedIndex === index}
          onSelect={handleSelect}
          data-testid="OptionItem__cb81f7"
        />
      ));
    }

    if (!loading) {
      return <li className={`${LIST_ITEM_BASE} ${TEXT_MUTED}`}>{t("multiselect.noOptionsFound")}</li>;
    }

    return null;
  }, [filteredOptions, highlightedIndex, selectedValues, handleSelect, showSkeleton, loading, t]);

  return (
    <div ref={wrapperRef} className="relative w-full font-['Inter']" tabIndex={-1}>
      <div
        onClick={handleClick}
        className={`w-full flex items-center justify-between py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 ${FOCUS_STYLES} 
          ${isOpen ? "rounded border-b-0 border-dynamic-main ring-2 ring-dynamic-light" : ""} 
          text-baseline-20 cursor-pointer hover:border-baseline-60 ${BASE_TRANSITION}`}>
        <input
          ref={searchInputRef}
          value={searchTerm}
          onChange={handleSetSearchTerm}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          placeholder={displayText}
          className={`w-full bg-transparent outline-none text-sm truncate max-w-[calc(100%-40px)] ${
            selectedLabels.length && !searchTerm ? "text-baseline-90 font-medium placeholder-baseline-90" : "text-baseline-90 placeholder-baseline-50"
          }`}
        />
        <div className="flex items-center flex-shrink-0 ml-2">
          {selectedLabels.length > 0 && (
            <button type="button" onClick={handleClear} className={`mr-1 ${TEXT_MUTED} ${HOVER_TEXT_COLOR} rounded`}>
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
      <DropdownPortal
        isOpen={isOpen}
        triggerRef={wrapperRef as React.RefObject<HTMLElement>}
        portalRef={portalRef as React.RefObject<HTMLDivElement>}
        minWidth={256}
        data-testid="DropdownPortal__cb81f7">
        <ul
          ref={listRef}
          className="overflow-y-auto focus:outline-none mt-1"
          style={{ maxHeight: `${maxHeight}px` }}
          onScroll={handleScroll}>
          {renderedOptions}
          {loading && hasMore && !showSkeleton && (
            <li className={`${LIST_ITEM_BASE} ${TEXT_MUTED} text-center`}>{t("multiselect.loadingOptions")}</li>
          )}
        </ul>
      </DropdownPortal>
    </div>
  );
});

export { MultiSelect };
export type { MultiSelectProps, MultiSelectOption };

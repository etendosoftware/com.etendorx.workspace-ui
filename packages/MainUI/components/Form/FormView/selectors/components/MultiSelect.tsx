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
        <Image src={checkIconUrl} alt="Selected Item" className="fade-in-left flex-shrink-0" height={16} width={16} />
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

  // Filtrado
  const filteredOptions = useMemo(() => {
    return internalOptions.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [internalOptions, searchTerm]);

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
      const newSelection = selectedValues.includes(id)
        ? selectedValues.filter((v) => v !== id)
        : [...selectedValues, id];
      onSelectionChange(newSelection);
    },
    [selectedValues, onSelectionChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectionChange([]);
    },
    [onSelectionChange]
  );

  const handleClick = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        if (internalOptions.length === 0) setIsFetchingInitial(true);
        onFocus?.();
      }
      return !prev;
    });
  }, [onFocus, internalOptions.length]);

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

  useClickOutside(wrapperRef, () => setIsOpen(false));

  const handleSetSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      onSearch?.(term);
    },
    [onSearch]
  );

  const handleScroll = useInfiniteScroll(listRef, loading, hasMore, onLoadMore);

  // Actualizar opciones cuando llegan props
  useEffect(() => {
    setInternalOptions(options);
    if (options.length > 0 || !loading) setIsFetchingInitial(false);
  }, [options, loading]);

  const showSkeleton = isFetchingInitial && internalOptions.length === 0;

  const renderedOptions = useMemo(() => {
    if (showSkeleton) {
      return [...Array(3)].map((_, index) => (
        <li key={`skeleton-${index}`} className={`${LIST_ITEM_BASE} pointer-events-none`}>
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
        onKeyDown={(e) => handleKeyboardActivation(e, handleClick)}
        className={`w-full flex items-center justify-between px-3 py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 ${FOCUS_STYLES} 
          ${isOpen ? "rounded border-b-0 border-dynamic-main ring-2 ring-dynamic-light" : ""} 
          text-baseline-20 cursor-pointer hover:border-baseline-60 ${BASE_TRANSITION}`}>
        <span
          className={`text-sm truncate max-w-[calc(100%-40px)] ${
            selectedLabels.length ? "text-baseline-90 font-medium" : "text-baseline-50"
          }`}>
          {displayText}
        </span>
        <div className="flex items-center flex-shrink-0 ml-2">
          {selectedLabels.length > 0 && isOpen && (
            <button type="button" onClick={handleClear} className={`mr-1 ${TEXT_MUTED} ${HOVER_TEXT_COLOR} rounded`}>
              <Image src={closeIconUrl} alt="Clear" height={16} width={16} />
            </button>
          )}
          <ChevronDown
            fill="currentColor"
            className={`${ICON_SIZE} ${TEXT_MUTED} transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white rounded shadow-lg overflow-hidden border border-transparent-neutral-10">
          <div className="p-2">
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={handleSetSearchTerm}
              onKeyDown={handleKeyDown}
              placeholder={t("multiselect.searchPlaceholder")}
              className="w-full p-2 text-sm border border-baseline-30 rounded focus:outline-none focus:border-dynamic-main focus:ring-1 focus:ring-dynamic-light"
            />
          </div>
          <ul
            ref={listRef}
            className="overflow-y-auto focus:outline-none"
            style={{ maxHeight: `${maxHeight}px` }}
            onScroll={handleScroll}>
            {renderedOptions}
            {/* Loader scroll infinito */}
            {loading && hasMore && !showSkeleton && (
              <li className={`${LIST_ITEM_BASE} ${TEXT_MUTED} text-center`}>{t("multiselect.loadingOptions")}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
});

export { MultiSelect };
export type { MultiSelectProps, MultiSelectOption };

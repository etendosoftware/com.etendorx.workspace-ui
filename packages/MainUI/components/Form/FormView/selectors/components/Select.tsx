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
} from "@/utils/selectorUtils";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import CheckIcon from "../../../../../../ComponentLibrary/src/assets/icons/check-circle-filled.svg";
import ChevronDown from "../../../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import XIcon from "../../../../../../ComponentLibrary/src/assets/icons/x.svg";
import type { SelectProps } from "./types";

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
    onOptionClick: (id: string, label: string) => void;
    onMouseEnter: (index: number) => void;
  }) => (
    <li
      aria-selected={isSelected}
      onClick={() => onOptionClick(id, label)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOptionClick(id, label);
        }
      }}
      onMouseEnter={() => onMouseEnter(index)}
      className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:bg-baseline-10
       ${isHighlighted ? "bg-baseline-10" : ""}
       ${isSelected ? "bg-baseline-10 font-medium" : ""}
       hover:bg-baseline-10`}>
      <span className={`truncate mr-2 ${isSelected ? "text-dynamic-dark" : "text-baseline-90"}`}>{label}</span>
      {isSelected && <CheckIcon alt="Selected Item" className="fade-in-left flex-shrink-0" height={16} width={16} />}
    </li>
  )
);

OptionItem.displayName = "OptionItem";

function SelectCmp({
  name,
  options,
  onFocus,
  isReadOnly,
  onSearch,
  onLoadMore,
  loading = false,
  hasMore = true,
  field,
}: SelectProps) {
  const { register, setValue, watch } = useFormContext();
  const selectedValue = watch(name);
  const currentIdentifier = watch(`${name}$_identifier`);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLLIElement>(null);
  const handleSearchChange = useSearchHandler(onSearch);

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const handleSelect = useCallback(
    (id: string, label: string) => {
      const option = options.find((opt) => opt.id === id);
      setValue(`${name}_data`, option?.data);
      setValue(name, id);
      setSelectedLabel(label);
      setIsOpen(false);
      setHighlightedIndex(-1);
      setIsFocused(false);
    },
    [name, options, setValue]
  );

  const handleOptionClick = useCallback(
    (id: string, label: string) => {
      handleSelect(id, label);
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
    (option) => handleSelect(option.id, option.label),
    () => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  );

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setIsFocused(false);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
        closeDropdown();
      }
    }, 0);
  }, [closeDropdown]);

  const handleSearchBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as Element | null;

      if (wrapperRef.current && relatedTarget && !wrapperRef.current.contains(relatedTarget)) {
        setTimeout(() => {
          if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
            closeDropdown();
          }
        }, 0);
      }
    },
    [closeDropdown]
  );

  const handleClick = useCallback(() => {
    if (!isReadOnly) {
      setIsOpen((prev) => !prev);
      setIsFocused(true);
    }
  }, [isReadOnly]);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setValue(name, "");
      setSelectedLabel("");
    },
    [name, setValue]
  );

  const { handleMouseEnter, handleMouseLeave } = useHoverHandlers(setIsHovering);

  const handleScroll = useInfiniteScroll(listRef, loading, hasMore, onLoadMore);

  const handleFocus = useFocusHandler(onFocus);

  useClickOutside(wrapperRef, () => closeDropdown());

  const handleSetSearchTerm = useSearchTermHandler(handleSearchChange, setSearchTerm);

  useEffect(() => {
    const selectedOption = options.find((option) => option.id === selectedValue);
    if (!selectedOption && selectedValue) {
      setSelectedLabel(currentIdentifier || selectedValue);
    } else {
      setSelectedLabel(selectedOption?.label ?? "");
    }
  }, [selectedValue, options, currentIdentifier]);

  useOpenDropdownEffect(isOpen, setSearchTerm, setHighlightedIndex, searchInputRef);

  const renderedOptions = useMemo(() => {
    if (filteredOptions.length > 0) {
      return filteredOptions.map(({ id, label }, index) => (
        <OptionItem
          key={id}
          id={id}
          label={label}
          index={index}
          isSelected={selectedValue === id}
          isHighlighted={highlightedIndex === index}
          onOptionClick={handleOptionClick}
          onMouseEnter={handleOptionMouseEnter}
        />
      ));
    }
    return <li className="px-4 py-3 text-sm text-baseline-60">No options found</li>;
  }, [filteredOptions, highlightedIndex, selectedValue, handleOptionClick, handleOptionMouseEnter]);

  const shouldShowClearButton = selectedLabel && (isHovering || isOpen) && !isReadOnly;

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full font-['Inter'] ${isReadOnly ? "pointer-events-none" : ""}`}
      onBlur={handleBlur}
      aria-label={field.name}
      aria-readonly={isReadOnly}
      aria-required={field.isMandatory}
      aria-disabled={isReadOnly}
      aria-details={field.helpComment}
      tabIndex={-1}>
      <input {...register(name)} type="hidden" readOnly={isReadOnly} />
      <div
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivation(e, handleClick)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        tabIndex={isReadOnly ? -1 : 0}
        className={`w-full flex items-center justify-between px-3 pr-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 
           ${
             isReadOnly
               ? "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)"
               : `bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5
                ${
                  isFocused || isOpen
                    ? "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]"
                    : "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)"
                }
                focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none cursor-pointer`
           }
           transition-colors outline-none`}>
        <span
          className={`text-sm truncate max-w-[calc(100%-40px)] font-medium ${
            selectedLabel
              ? (isFocused || isOpen) && !isReadOnly
                ? "text-[#004ACA]"
                : "text-(--color-transparent-neutral-80)"
              : "text-baseline-60"
          }`}>
          {selectedLabel || "Select an option"}
        </span>
        <div className="flex items-center flex-shrink-0 ml-2">
          {shouldShowClearButton && (
            <button
              type="button"
              onClick={handleClear}
              onKeyDown={(e) => handleKeyboardActivation(e, () => handleClear(e as unknown as React.MouseEvent))}
              className={`mr-1 hover:text-gray-600 transition-opacity opacity-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light rounded ${
                isFocused || isOpen ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
              }`}
              aria-label="Clear selection">
              <XIcon />
            </button>
          )}
          <ChevronDown
            fill="currentColor"
            className={`w-5 h-5 transition-transform ${
              isFocused || isOpen ? "text-(--color-baseline-100) rotate-180" : "text-(--color-transparent-neutral-60)"
            }`}
          />
        </div>
      </div>

      {!isReadOnly && isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded shadow-lg overflow-hidden">
          <div className="p-2">
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={handleSetSearchTerm}
              onKeyDown={handleKeyDown}
              onBlur={handleSearchBlur}
              placeholder="Search..."
              className="w-full p-2 text-sm border border-baseline-30 rounded focus:outline-none focus:border-dynamic-main focus:ring-1 focus:ring-dynamic-light"
              aria-label="Search options"
              onFocus={handleFocus}
            />
          </div>
          <ul ref={listRef} className="max-h-60 overflow-y-auto focus:outline-none" onScroll={handleScroll}>
            {renderedOptions}
            {loading && hasMore && (
              <li ref={loadingRef} className="px-4 py-3 text-sm text-baseline-60 text-center">
                Loading more options...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

const Select = memo(SelectCmp);
export default Select;
export { Select };

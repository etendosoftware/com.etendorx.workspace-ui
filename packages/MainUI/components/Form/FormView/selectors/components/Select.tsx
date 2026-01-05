import {
  handleKeyboardActivation,
  useFocusHandler,
  useHoverHandlers,
  useInfiniteScroll,
  useKeyboardNavigation,
  useOpenDropdownEffect,
  useSearchHandler,
  useSearchTermHandler,
} from "@/utils/selectorUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import CheckIcon from "../../../../../../ComponentLibrary/src/assets/icons/check-circle-filled.svg";
import ChevronDown from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import XIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import type { SelectProps } from "./types";

const useDropdownPosition = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLDivElement>,
  filteredOptionsCount: number,
  hasSearchInput = true
) => {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    showAbove: false,
  });

  const [fixedOrientation, setFixedOrientation] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setFixedOrientation(null);
      return;
    }

    const updatePosition = () => {
      const current = triggerRef.current;
      if (!current) return;
      const rect = current.getBoundingClientRect();
      const searchInputHeight = hasSearchInput ? 56 : 0;
      const optionHeight = 44;
      const maxOptionsVisible = 6;

      const visibleOptions = Math.min(filteredOptionsCount || 1, maxOptionsVisible);
      const dynamicDropdownHeight = searchInputHeight + visibleOptions * optionHeight;

      let shouldShowAbove: boolean;

      if (fixedOrientation !== null) {
        shouldShowAbove = fixedOrientation;
      } else {
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        shouldShowAbove = spaceBelow < dynamicDropdownHeight && spaceAbove > spaceBelow;

        setFixedOrientation(shouldShowAbove);
      }

      let top: number;
      if (shouldShowAbove) {
        top = rect.top + window.scrollY - dynamicDropdownHeight - 4;
      } else {
        top = rect.bottom + window.scrollY + 4;
      }

      setPosition({
        top,
        left: rect.left + window.scrollX,
        width: rect.width,
        showAbove: shouldShowAbove,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, triggerRef, filteredOptionsCount, hasSearchInput, fixedOrientation]);

  return position;
};

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
      data-testid={`OptionItem__${id}`}
      aria-selected={isSelected}
      onClick={(e) => {
        e.stopPropagation();
        onOptionClick(id, label);
      }}
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
      {isSelected && (
        <CheckIcon
          alt="Selected Item"
          className="fade-in-left flex-shrink-0"
          height={16}
          width={16}
          data-testid={`Image__${id}`}
        />
      )}
    </li>
  )
);
OptionItem.displayName = "OptionItem";

const SearchInput = memo(
  ({
    searchTerm,
    searchInputRef,
    handleSetSearchTerm,
    handleKeyDown,
    handleSearchBlur,
    handleFocus,
  }: {
    searchTerm: string;
    searchInputRef: React.RefObject<HTMLInputElement>;
    handleSetSearchTerm: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleSearchBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    handleFocus: () => void;
  }) => (
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
  )
);
SearchInput.displayName = "SearchInput";

const DropdownPortal = memo(
  ({
    isOpen,
    position,
    searchTerm,
    searchInputRef,
    handleSetSearchTerm,
    handleKeyDown,
    handleSearchBlur,
    handleFocus,
    listRef,
    handleScroll,
    renderedOptions,
    dropdownId,
  }: {
    isOpen: boolean;
    position: { top: number; left: number; width: number; showAbove: boolean };
    searchTerm: string;
    searchInputRef: React.RefObject<HTMLInputElement>;
    handleSetSearchTerm: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleSearchBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    handleFocus: () => void;
    listRef: React.RefObject<HTMLUListElement>;
    handleScroll: (e: React.UIEvent<HTMLUListElement>) => void;
    renderedOptions: React.ReactNode;
    loading: boolean;
    hasMore: boolean;
    loadingRef: React.RefObject<HTMLLIElement>;
    dropdownId: string;
  }) => {
    if (!isOpen) return null;

    const searchInputComponent = (
      <SearchInput
        searchTerm={searchTerm}
        searchInputRef={searchInputRef}
        handleSetSearchTerm={handleSetSearchTerm}
        handleKeyDown={handleKeyDown}
        handleSearchBlur={handleSearchBlur}
        handleFocus={handleFocus}
        data-testid="SearchInput__ff38f9"
      />
    );

    const optionsListComponent = (
      <ul ref={listRef} className="max-h-60 overflow-y-auto focus:outline-none" onScroll={handleScroll}>
        {renderedOptions}
      </ul>
    );

    return createPortal(
      <div
        data-dropdown-portal={dropdownId}
        className={`fixed z-[9999] bg-white rounded shadow-lg border border-gray-200 overflow-hidden ${
          position.showAbove ? "shadow-lg shadow-black/10" : "shadow-lg"
        }`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: "300px",
          transformOrigin: position.showAbove ? "bottom" : "top",
        }}
        onMouseDown={(e) => e.preventDefault()}>
        {position.showAbove ? (
          <>
            {optionsListComponent}
            {searchInputComponent}
          </>
        ) : (
          <>
            {searchInputComponent}
            {optionsListComponent}
          </>
        )}
      </div>,
      document.body
    );
  }
);
DropdownPortal.displayName = "DropdownPortal";

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
  const { t } = useTranslation();
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLLIElement>(null);

  const dropdownId = useMemo(() => `dropdown-${name}`, [name]);

  const handleSearchChange = useSearchHandler(onSearch);

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const dropdownPosition = useDropdownPosition(
    isOpen,
    triggerRef as React.RefObject<HTMLDivElement>,
    filteredOptions.length,
    true
  );

  const mainDivClassNames = useMemo(() => {
    const baseClasses =
      "w-full flex items-center justify-between px-3 pr-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 transition-colors outline-none";
    if (isReadOnly) {
      return `${baseClasses} bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)`;
    }
    const activeStateClasses = "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]";
    const hoverStateClasses =
      "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)";
    const focusStateClasses =
      "focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none cursor-pointer";
    const interactiveStateClasses = isFocused || isOpen ? activeStateClasses : hoverStateClasses;
    return `${baseClasses} bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 ${interactiveStateClasses} ${focusStateClasses}`;
  }, [isReadOnly, isFocused, isOpen]);

  const selectedLabelClassNames = useMemo(() => {
    const baseClasses = "text-sm truncate max-w-[calc(100%-40px)] font-medium";
    if (!selectedLabel) {
      return `${baseClasses} text-baseline-60`;
    }
    const isActiveState = (isFocused || isOpen) && !isReadOnly;
    const textColorClass = isActiveState ? "text-[#004ACA]" : "text-(--color-transparent-neutral-80)";
    return `${baseClasses} ${textColorClass}`;
  }, [selectedLabel, isFocused, isOpen, isReadOnly]);

  const clearButtonClassNames = useMemo(() => {
    const baseClasses =
      "mr-1 hover:text-gray-600 transition-opacity opacity-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light rounded";
    const textColorClass =
      isFocused || isOpen ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)";
    return `${baseClasses} ${textColorClass}`;
  }, [isFocused, isOpen]);

  const chevronClassNames = useMemo(() => {
    const baseClasses = "w-5 h-5 transition-transform";
    const isActiveState = isFocused || isOpen;
    const colorClass = isActiveState ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)";
    const rotationClass = isActiveState ? "rotate-180" : "";
    return `${baseClasses} ${colorClass} ${rotationClass}`;
  }, [isFocused, isOpen]);

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

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const relatedTarget = e.relatedTarget as Element | null;
      if (relatedTarget?.closest(`[data-dropdown-portal="${dropdownId}"]`)) {
        return;
      }
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInPortal = activeElement?.closest(`[data-dropdown-portal="${dropdownId}"]`);
        const isInWrapper = wrapperRef.current?.contains(activeElement);
        if (!isInPortal && !isInWrapper) {
          closeDropdown();
        }
      }, 150);
    },
    [closeDropdown, dropdownId]
  );

  const handleSearchBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as Element | null;
      if (wrapperRef.current?.contains(relatedTarget)) {
        return;
      }
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInPortal = activeElement?.closest(`[data-dropdown-portal="${dropdownId}"]`);
        const isInWrapper = wrapperRef.current?.contains(activeElement);
        if (!isInPortal && !isInWrapper) {
          closeDropdown();
        }
      }, 150);
    },
    [closeDropdown, dropdownId]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isReadOnly) {
        setIsOpen((prev) => !prev);
        setIsFocused(true);
      }
    },
    [isReadOnly]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setValue(name, "");
      setSelectedLabel("");
    },
    [name, setValue]
  );

  const { handleMouseEnter, handleMouseLeave } = useHoverHandlers(setIsHovering);
  const handleScroll = useInfiniteScroll(listRef as React.RefObject<HTMLUListElement>, loading, hasMore, onLoadMore);
  const handleFocus = useFocusHandler(onFocus);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInWrapper = wrapperRef.current?.contains(target);
      const isInPortal = target.closest(`[data-dropdown-portal="${dropdownId}"]`);
      if (!isInWrapper && !isInPortal) {
        closeDropdown();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeDropdown, dropdownId]);

  const handleSetSearchTerm = useSearchTermHandler(handleSearchChange, setSearchTerm);

  useEffect(() => {
    const selectedOption = options.find((option) => option.id === selectedValue);
    if (!selectedOption && selectedValue) {
      setSelectedLabel(currentIdentifier || selectedValue);
    } else {
      setSelectedLabel(selectedOption?.label ?? "");
    }
  }, [selectedValue, options, currentIdentifier]);

  useOpenDropdownEffect(
    isOpen,
    setSearchTerm,
    setHighlightedIndex,
    searchInputRef as React.RefObject<HTMLInputElement>
  );

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
          data-testid="OptionItem__ff38f9"
        />
      ));
    }
    return <li className="px-4 py-3 text-sm text-baseline-60">No options found</li>;
  }, [filteredOptions, highlightedIndex, selectedValue, handleOptionClick, handleOptionMouseEnter]);

  const shouldShowClearButton = selectedLabel && (isHovering || isOpen) && !isReadOnly;

  return (
    <>
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
          ref={triggerRef}
          onClick={handleClick}
          onKeyDown={(e) => handleKeyboardActivation(e, () => handleClick(e as unknown as React.MouseEvent))}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          tabIndex={isReadOnly ? -1 : 0}
          className={mainDivClassNames}>
          <span className={selectedLabelClassNames}>{selectedLabel || (!isReadOnly ? t("form.select.placeholder") : "")}</span>
          <div className="flex items-center flex-shrink-0 ml-2">
            {shouldShowClearButton && (
              <button
                type="button"
                onClick={handleClear}
                onKeyDown={(e) => handleKeyboardActivation(e, () => handleClear(e as unknown as React.MouseEvent))}
                className={clearButtonClassNames}
                aria-label="Clear selection">
                <XIcon data-testid={`XIcon__${field.id}`} />
              </button>
            )}
            {!isReadOnly && (
              <ChevronDown fill="currentColor" className={chevronClassNames} data-testid={`ChevronDown__${field.id}`} />
            )}
          </div>
        </div>
      </div>
      {!isReadOnly && (
        <DropdownPortal
          isOpen={isOpen}
          position={dropdownPosition}
          searchTerm={searchTerm}
          searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
          handleSetSearchTerm={handleSetSearchTerm}
          handleKeyDown={handleKeyDown}
          handleSearchBlur={handleSearchBlur}
          handleFocus={handleFocus}
          listRef={listRef as React.RefObject<HTMLUListElement>}
          handleScroll={handleScroll}
          renderedOptions={renderedOptions}
          loading={loading}
          hasMore={hasMore}
          loadingRef={loadingRef as React.RefObject<HTMLLIElement>}
          dropdownId={dropdownId}
          data-testid={`DropdownPortal__${field.id}`}
        />
      )}
    </>
  );
}

const Select = memo(SelectCmp);
export default Select;
export { Select };

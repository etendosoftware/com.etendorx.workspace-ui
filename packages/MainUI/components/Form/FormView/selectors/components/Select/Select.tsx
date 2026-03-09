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
import { useFormContext } from "react-hook-form";
import ChevronDown from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import XIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { SelectProps } from "../types";
import { useDropdownPosition } from "@/components/Form/FormView/selectors/hooks/useDropdownPosition";
import OptionItem from "@/components/Form/FormView/selectors/components/Select/OptionItem";
import DropdownPortal from "@/components/Form/FormView/selectors/components/Select/DropdownPortal";
import Tag from "@workspaceui/componentlibrary/src/components/Tag";
import { isColorString, getContrastTextColor } from "@/utils/color/utils";

const resolveOptionColor = (color?: string) => {
  if (!color) return { tagColor: undefined, textColor: undefined };
  const normalized = color.trim().toLowerCase();
  if (!isColorString(normalized)) return { tagColor: undefined, textColor: undefined };
  return { tagColor: normalized, textColor: getContrastTextColor(normalized) };
};

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
  columns,
}: SelectProps) {
  const { t } = useTranslation();
  const { register, setValue, watch } = useFormContext();
  const selectedValue = watch(name);
  const currentIdentifier = watch(`${name}$_identifier`);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedDataRowId, setSelectedDataRowId] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const dropdownId = useMemo(() => `dropdown-${name}`, [name]);

  const handleSearchChange = useSearchHandler(onSearch);

  const filteredOptions = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  const columnsMinWidth = columns?.length ? columns.length * 160 : 0;

  const dropdownViewportData = useDropdownPosition(
    isOpen,
    triggerRef as React.RefObject<HTMLDivElement>,
    columnsMinWidth
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
    (id: string, label: string, explicitData?: EntityData) => {
      const option = options.find((opt) => opt.id === id);
      const data = explicitData ?? option?.data;

      setValue(`${name}_data`, data);
      setValue(name, id);
      setSelectedLabel(label);
      setSelectedDataRowId(((data as Record<string, unknown>)?.id as string) ?? null);
      setSelectedColor(option?.color);

      setIsOpen(false);
      setHighlightedIndex(-1);
      setIsFocused(false);
    },
    [name, options, setValue]
  );

  const handleOptionClick = useCallback(
    (id: string, label: string, explicitData?: EntityData) => {
      handleSelect(id, label, explicitData);
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
    (option) => handleSelect(option.id, option.label, option.data as EntityData | undefined),
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
      setSelectedColor(undefined);
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
      setSelectedColor(undefined);
    } else {
      setSelectedLabel(selectedOption?.label ?? "");
      setSelectedColor(selectedOption?.color);
    }
  }, [selectedValue, options, currentIdentifier]);

  useOpenDropdownEffect(
    isOpen,
    setSearchTerm,
    setHighlightedIndex,
    searchInputRef as React.RefObject<HTMLInputElement>
  );

  // Scroll highlighted item into view when navigating with keyboard
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const headerOffset = columns?.length ? 1 : 0;
    const item = listRef.current.children[highlightedIndex + headerOffset] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, columns]);

  const gridStyle = useMemo(
    () => (columns?.length ? { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` } : undefined),
    [columns]
  );

  const renderedOptions = useMemo(() => {
    if (loading && filteredOptions.length === 0) {
      return <li className="px-4 py-3 text-sm text-baseline-60">Loading...</li>;
    }

    if (filteredOptions.length > 0) {
      const optionsList = columns?.length
        ? filteredOptions.map((option, index) => {
            const dataRowId = (option.data as Record<string, unknown>)?.id as string | undefined;
            const isSelected = selectedDataRowId ? selectedDataRowId === dataRowId : selectedValue === option.id;
            const isHighlighted = highlightedIndex === index;
            return (
              <li
                key={`${option.id}-${index}`}
                data-testid={`OptionItem__${option.id}`}
                aria-selected={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionClick(option.id, option.label, option.data as EntityData | undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOptionClick(option.id, option.label, option.data as EntityData | undefined);
                  }
                }}
                onMouseEnter={() => handleOptionMouseEnter(index)}
                className={`px-4 py-2 text-sm cursor-pointer grid gap-2 focus:outline-none
                  ${isHighlighted ? "bg-baseline-10" : ""}
                  ${isSelected ? "bg-baseline-10 font-medium" : ""}
                  hover:bg-baseline-10`}
                style={gridStyle}>
                {columns.map((col) => {
                  const raw = (option.data as Record<string, unknown>)?.[col.accessorKey];
                  const ident = (option.data as Record<string, unknown>)?.[`${col.accessorKey}$_identifier`];
                  return (
                    <span
                      key={col.accessorKey}
                      className={`truncate ${isSelected ? "text-dynamic-dark" : "text-baseline-90"}`}>
                      {((ident ?? raw) as string) || "-"}
                    </span>
                  );
                })}
              </li>
            );
          })
        : filteredOptions.map((option, index) => (
            <OptionItem
              key={option.id}
              id={option.id}
              label={option.label}
              data={option.data}
              color={option.color}
              index={index}
              isSelected={selectedValue === option.id}
              isHighlighted={highlightedIndex === index}
              onOptionClick={handleOptionClick}
              onMouseEnter={handleOptionMouseEnter}
              data-testid="OptionItem__ff38f9"
            />
          ));

      if (loading) {
        optionsList.push(
          <li key="loading-indicator" className="px-4 py-3 text-sm text-baseline-60">
            Loading...
          </li>
        );
      }

      return optionsList;
    }
    return <li className="px-4 py-3 text-sm text-baseline-60">No options found</li>;
  }, [
    filteredOptions,
    highlightedIndex,
    selectedValue,
    selectedDataRowId,
    handleOptionClick,
    handleOptionMouseEnter,
    loading,
    columns,
    gridStyle,
  ]);

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
          {selectedLabel && selectedColor ? (
            (() => {
              const { tagColor, textColor } = resolveOptionColor(selectedColor);
              return tagColor ? (
                <Tag label={selectedLabel} tagColor={tagColor} textColor={textColor} data-testid={`SelectTag__${field.id}`} />
              ) : (
                <span className={selectedLabelClassNames}>{selectedLabel}</span>
              );
            })()
          ) : (
            <span className={selectedLabelClassNames}>
              {selectedLabel || (!isReadOnly ? t("form.select.placeholder") : "")}
            </span>
          )}
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
          viewportData={dropdownViewportData}
          searchTerm={searchTerm}
          searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
          handleSetSearchTerm={handleSetSearchTerm}
          handleKeyDown={handleKeyDown}
          handleSearchBlur={handleSearchBlur}
          handleFocus={handleFocus}
          listRef={listRef as React.RefObject<HTMLUListElement>}
          handleScroll={handleScroll}
          renderedOptions={
            <>
              {columns?.length ? (
                <li
                  className="px-4 py-2 grid gap-2 border-b-2 border-gray-300 bg-gray-50 sticky top-0 z-10"
                  style={gridStyle}>
                  {columns.map((col) => (
                    <span key={col.accessorKey} className="text-xs font-semibold text-gray-500 uppercase truncate">
                      {col.header}
                    </span>
                  ))}
                </li>
              ) : null}
              {renderedOptions}
            </>
          }
          dropdownId={dropdownId}
          minWidth={columnsMinWidth}
          data-testid={`DropdownPortal__${field.id}`}
        />
      )}
    </>
  );
}

const Select = memo(SelectCmp);
export default Select;
export { Select };

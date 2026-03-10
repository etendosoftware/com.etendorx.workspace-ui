import { memo, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SearchInput from "@/components/Form/FormView/selectors/components/Select/SearchInput";
import type { DropdownViewportData } from "@/components/Form/FormView/selectors/hooks/useDropdownPosition";

const GAP = 4;
const MAX_DROPDOWN_HEIGHT = 300;

const DropdownPortal = memo(
  ({
    isOpen,
    viewportData,
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
    minWidth,
  }: {
    isOpen: boolean;
    viewportData: DropdownViewportData;
    searchTerm: string;
    searchInputRef: React.RefObject<HTMLInputElement>;
    handleSetSearchTerm: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    handleSearchBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    handleFocus: () => void;
    listRef: React.RefObject<HTMLUListElement>;
    handleScroll: (e: React.UIEvent<HTMLUListElement>) => void;
    renderedOptions: React.ReactNode;
    dropdownId: string;
    minWidth?: number;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showAbove, setShowAbove] = useState(false);
    const [isPositioned, setIsPositioned] = useState(false);

    // After each render, measure actual height and decide above/below
    useLayoutEffect(() => {
      if (!isOpen) {
        setIsPositioned(false);
        return;
      }
      const container = containerRef.current;
      if (!container) return;

      const actualHeight = Math.min(container.scrollHeight, MAX_DROPDOWN_HEIGHT);
      const { spaceBelow, spaceAbove } = viewportData;

      const shouldShowAbove = spaceBelow < actualHeight + GAP && spaceAbove > spaceBelow;
      setShowAbove(shouldShowAbove);
      setIsPositioned(true);
    });

    if (!isOpen) return null;

    const { triggerTop, triggerBottom, left, width, spaceBelow, spaceAbove } = viewportData;
    const dropdownWidth = Math.max(width, minWidth ?? 0);

    const top = showAbove ? triggerTop - GAP : triggerBottom + GAP;
    const maxHeight = showAbove
      ? Math.min(MAX_DROPDOWN_HEIGHT, spaceAbove - GAP)
      : Math.min(MAX_DROPDOWN_HEIGHT, spaceBelow - GAP);

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

    return createPortal(
      <div
        ref={containerRef}
        data-dropdown-portal={dropdownId}
        className="fixed z-[9999] bg-white rounded shadow-lg border border-gray-200 overflow-hidden flex"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${dropdownWidth}px`,
          maxHeight: `${maxHeight}px`,
          flexDirection: showAbove ? "column-reverse" : "column",
          transform: showAbove ? "translateY(-100%)" : undefined,
          transformOrigin: showAbove ? "bottom" : "top",
          visibility: isPositioned ? "visible" : "hidden",
        }}>
        {searchInputComponent}
        <ul ref={listRef} className="max-h-60 overflow-y-auto focus:outline-none flex-1 min-h-0" onScroll={handleScroll} onMouseDown={(e) => e.preventDefault()}>
          {renderedOptions}
        </ul>
      </div>,
      document.body
    );
  }
);
DropdownPortal.displayName = "DropdownPortal";

export default DropdownPortal;

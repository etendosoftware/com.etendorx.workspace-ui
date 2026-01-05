import { memo } from "react";
import { createPortal } from "react-dom";
import SearchInput from "@/components/Form/FormView/selectors/components/Select/SearchInput";

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

export default DropdownPortal;

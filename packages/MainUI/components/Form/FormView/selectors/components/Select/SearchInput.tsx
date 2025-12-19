import { memo } from "react";

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

export default SearchInput;

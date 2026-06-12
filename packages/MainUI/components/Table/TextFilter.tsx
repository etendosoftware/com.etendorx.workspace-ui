import type React from "react";
import { useState, useEffect } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import { isTextFilterValue } from "@workspaceui/api-client/src/utils/column-filter-utils";
import type { TextFilterValue } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useDebouncedCallback } from "./utils/performanceOptimizations";

export interface TextFilterProps {
  column: Column;
  onFilterChange: (filterValue: string) => void;
  filterValue?: string | TextFilterValue;
}

export const TextFilter: React.FC<TextFilterProps> = ({ column, onFilterChange, filterValue }) => {
  const [inputValue, setInputValue] = useState("");

  const debouncedFilterChange = useDebouncedCallback((value: string) => {
    onFilterChange(value);
  }, 500);

  useEffect(() => {
    setInputValue(isTextFilterValue(filterValue) ? filterValue.text : filterValue || "");
  }, [filterValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedFilterChange(value);
  };

  return (
    <div className="w-full flex items-center py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 transition-colors">
      <input
        type="text"
        placeholder={`Filter ${column.name || column.columnName}...`}
        value={inputValue}
        onChange={handleInputChange}
        className="w-full bg-transparent text-sm outline-none placeholder-baseline-50"
      />
    </div>
  );
};

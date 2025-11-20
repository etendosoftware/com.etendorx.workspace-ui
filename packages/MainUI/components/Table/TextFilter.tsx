import type React from "react";
import { useState } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";

export interface TextFilterProps {
  column: Column;
  onFilterChange: (filterValue: string) => void;
}

export const TextFilter: React.FC<TextFilterProps> = ({ column, onFilterChange }) => {
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onFilterChange(value);
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

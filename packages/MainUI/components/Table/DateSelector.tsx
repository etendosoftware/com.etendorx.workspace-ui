import type React from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";

export interface DateSelectorProps {
  column: Column;
  onFilterChange: (filterValue: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ column, onFilterChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(e.target.value);
  };

  const handleDatePickerClick = () => {
    alert(`📅 Date picker for ${column.name || column.columnName}\n\nCalendar selector will open here.`);
  };

  return (
    <div className="w-full flex items-center px-3 py-2 h-10 border-b border-baseline-10 hover:bg-baseline-5 transition-colors gap-2">
      <input
        type="text"
        placeholder={`Filter ${column.name || column.columnName}...`}
        onChange={handleInputChange}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder-baseline-50"
      />
      <button
        type="button"
        onClick={handleDatePickerClick}
        className="flex-shrink-0 text-xl hover:opacity-70 transition-opacity"
        title={`Open date picker for ${column.name || column.columnName}`}>
        📅
      </button>
    </div>
  );
};

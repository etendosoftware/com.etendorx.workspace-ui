import type React from "react";
import { useState } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import DateRangeModal from "../../../ComponentLibrary/src/components/RangeDateModal/RangeDateModal";
import { formatBrowserDate } from "../../../MainUI/utils/dateFormatter";
import CalendarIcon from "../../../ComponentLibrary/src/assets/icons/calendar.svg";
import { useTranslation } from "@/hooks/useTranslation";

export interface DateSelectorProps {
  column: Column;
  onFilterChange: (filterValue: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ column, onFilterChange }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onFilterChange(e.target.value);
  };

  const handleDatePickerClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // Helper to format date as YYYY-MM-DD for backend (respects timezone)
  const formatDateAsISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateConfirm = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);

    // Format dates using browser locale for display and YYYY-MM-DD for backend
    if (start && end) {
      // Range: desde y hasta
      // Display in browser locale format
      const displayValue = `${formatBrowserDate(start)} - ${formatBrowserDate(end)}`;
      setInputValue(displayValue);
      // Send in YYYY-MM-DD format for consistent parsing
      const filterValue = `${formatDateAsISO(start)} - ${formatDateAsISO(end)}`;
      onFilterChange(filterValue);
    } else if (start && !end) {
      // Only start date: should be treated as "desde" (greaterOrEqual)
      const displayValue = `Desde ${formatBrowserDate(start)}`;
      setInputValue(displayValue);
      // Format: "YYYY-MM-DD - " to be detected as range by LegacyColumnFilterUtils
      const filterValue = `${formatDateAsISO(start)} - `;
      onFilterChange(filterValue);
    } else if (!start && end) {
      // Only end date: should be treated as "hasta" (lessOrEqual)
      const displayValue = `Hasta ${formatBrowserDate(end)}`;
      setInputValue(displayValue);
      // Format: " - YYYY-MM-DD" to be detected as range by LegacyColumnFilterUtils
      const filterValue = ` - ${formatDateAsISO(end)}`;
      onFilterChange(filterValue);
    } else {
      setInputValue("");
      onFilterChange("");
    }
  };

  return (
    <>
      <div className="w-full flex items-center py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 transition-colors gap-2">
        <input
          type="text"
          placeholder={`Filter ${column.name || column.columnName}...`}
          value={inputValue}
          onChange={handleInputChange}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder-baseline-50"
        />
        <button
          type="button"
          onClick={handleDatePickerClick}
          className="flex-shrink-0 text-xl hover:opacity-70 transition-opacity"
          title={`Open date picker for ${column.name || column.columnName}`}>
          <CalendarIcon className={"fill-(--color-baseline-110)"} />
        </button>
      </div>

      <DateRangeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleDateConfirm}
        initialStartDate={startDate || undefined}
        initialEndDate={endDate || undefined}
        t={t as (key: string) => string}
      />
    </>
  );
};

import type React from "react";
import { useState, useEffect } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import DateRangeModal from "../../../ComponentLibrary/src/components/RangeDateModal/RangeDateModal";
import { formatBrowserDate } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import CalendarIcon from "../../../ComponentLibrary/src/assets/icons/calendar.svg";
import { useTranslation } from "@/hooks/useTranslation";

export interface DateSelectorProps {
  column: Column;
  onFilterChange: (filterValue: string) => void;
  filterValue?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ column, onFilterChange, filterValue }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [inputValue, setInputValue] = useState("");

  // Synchronize inputValue when filterValue changes externally (e.g., from "Use as filter")
  // Also handle clearing when filterValue becomes undefined
  // Parse and format the filterValue from state properly
  useEffect(() => {
    if (!filterValue) {
      setInputValue("");
      setStartDate(null);
      setEndDate(null);
      return;
    }

    // Parse the filter value which could be:
    // "YYYY-MM-DD - YYYY-MM-DD" (range)
    // "YYYY-MM-DD - " (desde/from only)
    // " - YYYY-MM-DD" (hasta/to only)
    const parts = filterValue.split(" - ");
    const startStr = parts[0]?.trim();
    const endStr = parts[1]?.trim();

    let displayValue = "";
    let parsedStart: Date | null = null;
    let parsedEnd: Date | null = null;

    // Parse the dates if they exist
    if (startStr) {
      const [year, month, day] = startStr.split("-");
      parsedStart = new Date(Number(year), Number(month) - 1, Number(day));
      setStartDate(parsedStart);
    }

    if (endStr) {
      const [year, month, day] = endStr.split("-");
      parsedEnd = new Date(Number(year), Number(month) - 1, Number(day));
      setEndDate(parsedEnd);
    }

    // Format the display value the same way handleDateConfirm does
    if (parsedStart && parsedEnd) {
      displayValue = `${formatBrowserDate(parsedStart)} - ${formatBrowserDate(parsedEnd)}`;
    } else if (parsedStart && !parsedEnd) {
      displayValue = `${t("dateModal.from")} - ${formatBrowserDate(parsedStart)}`;
    } else if (!parsedStart && parsedEnd) {
      displayValue = `${t("dateModal.to")} - ${formatBrowserDate(parsedEnd)}`;
    }

    setInputValue(displayValue);
  }, [filterValue, t]);

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
          <CalendarIcon className={"fill-(--color-baseline-110)"} data-testid="CalendarIcon__72491e" />
        </button>
      </div>
      <DateRangeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleDateConfirm}
        initialStartDate={startDate || undefined}
        initialEndDate={endDate || undefined}
        t={t as (key: string) => string}
        data-testid="DateRangeModal__72491e"
      />
    </>
  );
};

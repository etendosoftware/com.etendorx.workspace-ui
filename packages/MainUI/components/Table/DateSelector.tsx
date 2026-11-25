import type React from "react";
import { useState, useEffect, useRef } from "react";
import type { Column } from "@workspaceui/api-client/src/api/types";
import DateRangeModal from "../../../ComponentLibrary/src/components/RangeDateModal/RangeDateModal";
import {
  buildDateFilterValue,
  type DateFilterMode,
  type DateFilterSelection,
  formatDateFilterLabel,
  parseDateFilterValue,
} from "@workspaceui/componentlibrary/src/components/RangeDateModal/dateFilterSelection";
import CalendarIcon from "../../../ComponentLibrary/src/assets/icons/calendar.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveTypedDateFilter } from "@/utils/table/filters/dateColumnFilter";
import { useDebouncedCallback } from "./utils/performanceOptimizations";

const TYPING_DEBOUNCE_MS = 500;
const ENTER_KEY = "Enter";

export interface DateSelectorProps {
  column: Column;
  onFilterChange: (filterValue: string) => void;
  filterValue?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ column, onFilterChange, filterValue }) => {
  const { t } = useTranslation();
  const translate = t as (key: string) => string;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selection, setSelection] = useState<DateFilterSelection | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [hasInvalidDate, setHasInvalidDate] = useState(false);
  // Last value applied from the text typed in the column: its echo must not rewrite what the user typed
  const typedValueRef = useRef<string | undefined>(undefined);
  // The text was edited since the filter was last shown, so it has to be checked when leaving the field
  const isEditingRef = useRef(false);

  // Show the applied filter (from the window, "Use as filter", a saved view or a clear) as a readable text
  useEffect(() => {
    const parsed = parseDateFilterValue(filterValue);
    setSelection(parsed);
    setHasInvalidDate(false);
    if (filterValue && filterValue === typedValueRef.current) return;

    typedValueRef.current = undefined;
    isEditingRef.current = false;
    setInputValue(parsed ? formatDateFilterLabel(parsed, translate) : (filterValue ?? ""));
  }, [filterValue, translate]);

  const applyTypedValue = (value: string) => {
    if (value === typedValueRef.current) return;
    typedValueRef.current = value;
    onFilterChange(value);
  };

  // While typing, only a date or an expression is applied; invalid text is reported when leaving the field
  const debouncedApply = useDebouncedCallback((text: string) => {
    const value = resolveTypedDateFilter(text);
    if (value !== null) applyTypedValue(value);
  }, TYPING_DEBOUNCE_MS);

  const commitTypedText = () => {
    if (!isEditingRef.current) return;
    debouncedApply.cancel();
    const value = resolveTypedDateFilter(inputValue);
    if (value === null) {
      setHasInvalidDate(true);
      return;
    }
    applyTypedValue(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isEditingRef.current = true;
    setHasInvalidDate(false);
    setInputValue(e.target.value);
    debouncedApply(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ENTER_KEY) commitTypedText();
  };

  const handleDatePickerClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleDateConfirm = (start: Date | null, end: Date | null, mode: DateFilterMode) => {
    const confirmed: DateFilterSelection = { mode, start, end };
    debouncedApply.cancel();
    typedValueRef.current = undefined;
    isEditingRef.current = false;
    setHasInvalidDate(false);
    setSelection(confirmed);
    setInputValue(formatDateFilterLabel(confirmed, translate));
    onFilterChange(buildDateFilterValue(confirmed));
  };

  const columnLabel = column.name || column.columnName;
  const invalidDateMessage = translate("dateModal.invalidDate");
  const underlineClass = hasInvalidDate ? "border-red-500" : "border-baseline-10 hover:border-baseline-100";

  return (
    <>
      <div
        className={`w-full flex items-center py-2 h-10 border-b ${underlineClass} transition-colors gap-2`}
        title={hasInvalidDate ? invalidDateMessage : undefined}>
        <input
          type="text"
          placeholder={`Filter ${columnLabel}...`}
          value={inputValue}
          aria-invalid={hasInvalidDate}
          onChange={handleInputChange}
          onBlur={commitTypedText}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-(--ui-text-muted) placeholder:font-normal"
        />
        <button
          type="button"
          onClick={handleDatePickerClick}
          className="flex-shrink-0 text-xl hover:opacity-70 transition-opacity"
          title={`Open date picker for ${columnLabel}`}>
          <CalendarIcon className={"fill-(--color-baseline-110)"} data-testid="CalendarIcon__72491e" />
        </button>
      </div>
      <DateRangeModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConfirm={handleDateConfirm}
        initialStartDate={selection?.start ?? undefined}
        initialEndDate={selection?.end ?? undefined}
        initialMode={selection?.mode}
        t={translate}
        data-testid="DateRangeModal__72491e"
      />
    </>
  );
};

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CalendarIcon from "../../assets/icons/calendar.svg";
import ChevronLeftIcon from "../../assets/icons/chevron-left.svg";
import ChevronRightIcon from "../../assets/icons/chevron-right.svg";
import ChevronDownIcon from "../../assets/icons/chevron-down.svg";
import EraserIcon from "../../assets/icons/eraser.svg";
import XIcon from "../../assets/icons/x.svg";
import Button from "../Button/Button";
import { formatBrowserDate, getLocaleDatePlaceholder } from "../../utils/dateFormatter";

// Simple TextInput-like component for the modal
const DateInput = ({
  label,
  value,
  placeholder,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
}) => {
  return (
    <div>
      <label className="flex flex-col text-xs font-semibold text-(--color-baseline-80) uppercase tracking-wider mb-1.5">
        {label}
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 pr-10 bg-white border-b-2 border-gray-300 rounded-t text-gray-700 text-sm
              focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors shadow-sm
              hover:border-gray-400"
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:text-gray-600 transition-colors z-10 flex items-center justify-center">
              <XIcon height={20} width={20} className="fill-(--color-baseline-80)" />
            </button>
          )}
        </div>
      </label>
    </div>
  );
};

type TranslateFn = (key: string) => string;

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date | null, endDate: Date | null) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  t?: TranslateFn;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialStartDate,
  initialEndDate,
  t,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Refs for month and year selects
  const monthSelectRef = useRef<HTMLSelectElement>(null);
  const yearSelectRef = useRef<HTMLSelectElement>(null);

  // Translation helper with fallback to English defaults
  const translate = (key: string, defaultValue: string): string => {
    if (t) {
      return t(key);
    }
    const defaults: Record<string, string> = {
      "dateModal.selectDates": "Select dates",
      "dateModal.from": "From",
      "dateModal.to": "To",
      "dateModal.clearFilters": "Clear filters",
      "common.cancel": "Cancel",
      "common.confirm": "Confirm",
    };
    return defaults[key] || defaultValue;
  };

  // 1. Generate month names using browser locale (Intl API)
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    const monthName = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
    const cleanName = monthName.replace(".", "");
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  });

  // 2. Generate years
  const currentYear = new Date().getFullYear();
  const startYear = 1980;
  const endYear = currentYear + 5;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // 3. Week days
  const getWeekDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(2024, 0, i);
      const dayName = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
      days.push(dayName.replace(".", "").slice(0, 2).toUpperCase());
    }
    return days;
  };

  const weekDays = getWeekDays();
  const datePlaceholder = getLocaleDatePlaceholder();

  const handleClearStart = () => {
    setStartDate(null);
  };

  const handleClearEnd = () => {
    setEndDate(null);
  };

  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStartDate || null);
      setEndDate(initialEndDate || null);
      setCurrentMonth(initialStartDate ? new Date(initialStartDate) : new Date());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialStartDate, initialEndDate]);

  if (!isOpen) return null;

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const formatDate = (date: Date | null) => {
    return formatBrowserDate(date);
  };

  // Handle date selection with proper range logic
  const handleDateClick = (selectedDate: Date) => {
    // If no start date or we have a complete range, start a new range
    if (!startDate || endDate) {
      setStartDate(selectedDate);
      setEndDate(null);
    }
    // If we have start date but no end date, set end date
    else {
      // If selected date is before start date, swap them
      if (selectedDate < startDate) {
        setEndDate(startDate);
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }

    // Move calendar to the selected month if needed
    if (selectedDate.getMonth() !== currentMonth.getMonth()) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  };

  // Helper to determine visual state
  const getDateSelection = (dateToCheck: Date) => {
    // Normalize time to midnight for comparison
    const target = new Date(dateToCheck);
    target.setHours(0, 0, 0, 0);
    const targetTime = target.getTime();

    const start = startDate
      ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime()
      : 0;
    const end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime() : 0;

    if (startDate && targetTime === start) return "start";
    if (endDate && targetTime === end) return "end";
    if (startDate && endDate && targetTime > start && targetTime < end) return "range";

    return null;
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonthIndex = Number.parseInt(e.target.value);
    const newDate = new Date(currentMonth.getFullYear(), newMonthIndex, 1);
    setCurrentMonth(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = Number.parseInt(e.target.value);
    const newDate = new Date(newYear, currentMonth.getMonth(), 1);
    setCurrentMonth(newDate);
  };

  const changeMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const handleConfirm = () => {
    // Allow confirmation with any combination of dates:
    // - Both dates (range)
    // - Only start date (desde - greaterOrEqual)
    // - Only end date (hasta - lessOrEqual)
    // - No dates (clear filter)
    onConfirm(startDate, endDate);
    onClose();
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];

    const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonthDate);

    for (let i = 0; i < firstDayOfMonth; i++) {
      const dayNum = daysInPrevMonth - firstDayOfMonth + 1 + i;
      const date = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), dayNum);

      days.push(
        <div key={`prev-${dayNum}`} className="h-8 w-full flex items-center justify-center">
          <button
            type="button"
            onClick={() => handleDateClick(date)}
            className="h-8 w-8 flex items-center justify-center text-sm text-(--color-transparent-neutral-50) hover:text-(--color-transparent-neutral-80) hover:bg-gray-50 rounded-full transition-colors">
            {dayNum}
          </button>
        </div>
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const selection = getDateSelection(currentDate);

      const today = new Date();
      const isToday =
        currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      const isStart = selection === "start";
      const isEnd = selection === "end";
      const isRange = selection === "range";
      const hasRangeStrip = startDate && endDate;

      days.push(
        <div key={day} className="relative h-8 w-full flex items-center justify-center p-0">
          {isRange && <div className="absolute inset-0 bg-blue-100" />}
          {isStart && hasRangeStrip && <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-blue-100" />}
          {isEnd && hasRangeStrip && <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-blue-100" />}

          <button
            type="button"
            onClick={() => handleDateClick(currentDate)}
            className={`
              relative h-8 w-8 flex items-center justify-center text-sm font-medium transition-all rounded-full
              ${
                isStart || isEnd
                  ? "bg-blue-700 text-white hover:bg-blue-800 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }
              ${isRange ? "bg-transparent hover:bg-blue-200/50" : ""}
              ${isToday && !isStart && !isEnd ? "ring-1 ring-blue-700 text-blue-700 font-bold" : ""}
            `}>
            {day}
          </button>
        </div>
      );
    }

    const totalCellsRendered = firstDayOfMonth + daysInMonth;
    const remainingCells = 7 - (totalCellsRendered % 7);

    if (remainingCells < 7) {
      const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

      for (let i = 1; i <= remainingCells; i++) {
        const date = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), i);

        days.push(
          <div key={`next-${i}`} className="h-8 w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => handleDateClick(date)}
              className="h-8 w-8 flex items-center justify-center text-sm text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors">
              {i}
            </button>
          </div>
        );
      }
    }

    return days;
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000]" style={{ isolation: "isolate" }}>
      <div
        role="button"
        tabIndex={0}
        className="absolute inset-0 bg-black/60 "
        onClick={onClose}
        onKeyUp={(e) => (e.key === "Enter" ? onClose() : null)}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-[650px] pointer-events-auto overflow-hidden">
          {/* Header Modal */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2 text-gray-800">
              <div className="rounded-full bg-gray-100 p-2">
                <CalendarIcon height={20} width={20} className="fill-(--color-baseline-80)" />
              </div>
              <h2 className="text-lg font-semibold">{translate("dateModal.selectDates", "Select dates")}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-(--color-baseline-80) hover:text-(--color-etendo-main) transition-colors p-2 rounded-full hover:bg-gray-100">
              <XIcon height={20} width={20} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Sidebar Izquierdo (Inputs) */}
            <div className="w-full md:w-64 bg-gray-50/50 p-6 border-r border-gray-100 flex flex-col justify-between">
              <div className="space-y-5">
                <DateInput
                  label={translate("dateModal.from", "From")}
                  value={formatDate(startDate)}
                  placeholder={datePlaceholder.toUpperCase()}
                  onClear={handleClearStart}
                />
                <DateInput
                  label={translate("dateModal.to", "To")}
                  value={formatDate(endDate)}
                  placeholder={datePlaceholder.toUpperCase()}
                  onClear={handleClearEnd}
                />
              </div>
            </div>

            {/* Calendario Derecho */}
            <div className="flex-1 p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {/* Selector de MES */}
                  <div className="relative w-20 flex justify-center items-center group hover:cursor-pointer transition-colors gap-1">
                    <select
                      ref={monthSelectRef}
                      value={currentMonth.getMonth()}
                      onChange={handleMonthChange}
                      className="absolute inset-0 w-full h-full appearance-none bg-transparent text-lg text-(--color-baseline-80) cursor-pointer outline-none opacity-0">
                      {months.map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none text-lg font-normal text-(--color-baseline-80) group-hover:text-(--color-dynamic-main) transition-colors">
                      {months[currentMonth.getMonth()]}
                    </div>
                    <div className="pointer-events-none transition-colors">
                      <ChevronDownIcon
                        height={20}
                        width={20}
                        className="fill-(--color-baseline-80) group-hover:fill-(--color-dynamic-main)"
                      />
                    </div>
                  </div>

                  {/* Selector de AÑO */}
                  <div className="relative w-20 flex justify-center items-center group hover:cursor-pointer transition-colors gap-1">
                    <select
                      ref={yearSelectRef}
                      value={currentMonth.getFullYear()}
                      onChange={handleYearChange}
                      className="absolute inset-0 w-full h-full appearance-none bg-transparent text-lg font-normal text-(--color-baseline-80) cursor-pointer outline-none opacity-0">
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none text-lg font-normal text-(--color-baseline-80) group-hover:text-(--color-dynamic-main) transition-colors">
                      {currentMonth.getFullYear()}
                    </div>
                    <div className="pointer-events-none group-hover:fill-(--color-dynamic-main) transition-colors">
                      <ChevronDownIcon
                        height={20}
                        width={20}
                        className="fill-(--color-baseline-80) group-hover:fill-(--color-dynamic-main)"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center rounded-lg p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-all hover:text-(--color-dynamic-main) group ">
                    <ChevronLeftIcon
                      height={20}
                      width={20}
                      className="fill-(--color-baseline-80) group-hover:fill-(--color-dynamic-main)"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-all hover:text-(--color-dynamic-main) group ">
                    <ChevronRightIcon
                      height={20}
                      width={20}
                      className="fill-(--color-baseline-80) group-hover:fill-(--color-dynamic-main)"
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="h-8 flex items-center justify-center text-xs text-(color-transparent-neutral-70) uppercase tracking-wide">
                    {day}
                  </div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-(--color-etendo-main) hover:text-(--color-baseline-80) font-medium transition-colors flex items-center gap-2 group px-2 py-1 rounded-md w-fit">
              {translate("dateModal.clearFilters", "Clear filters")}
              <EraserIcon
                height={20}
                width={20}
                className="fill-(--color-etendo-main) group-hover:fill-(--color-baseline-80) transition-colors"
              />
            </button>
            <div className="flex gap-3">
              <Button variant="outlined" size="large" className="w-auto" onClick={onClose}>
                {translate("common.cancel", "Cancel")}
              </Button>
              <Button size="large" className="w-auto" onClick={handleConfirm}>
                {translate("common.confirm", "Confirm")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DateRangeModal;

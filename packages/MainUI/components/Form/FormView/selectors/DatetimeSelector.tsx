/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useFormContext } from "react-hook-form";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import CalendarIcon from "../../../../../ComponentLibrary/src/assets/icons/calendar.svg";
import { formatClassicDate, getLocaleDatetimePlaceholder } from "../../../../utils/dateFormatter";

interface DatetimeSelectorProps {
  field: Field;
  isReadOnly?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
}

function convertCustomDateFormat(customDate: string): string {
  if (!customDate) return "";

  const customPattern = /^(\d{2})T([\d:\.]+)Z-(\d{2})-(\d{4})$/;
  const match = customDate.match(customPattern);

  if (!match) {
    return customDate;
  }

  const [, day, time, month, year] = match;

  return `${year}-${month}-${day}T${time}Z`;
}

function formatDateForInputSafe(value: string): string {
  if (!value) return "";

  const convertedValue = convertCustomDateFormat(value);

  const date = new Date(convertedValue);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export const DatetimeSelector = ({ field, isReadOnly, error, helperText }: DatetimeSelectorProps) => {
  const { register, getValues, formState } = useFormContext();
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>("");
  const hiddenDatetimeInputRef = useRef<HTMLInputElement | null>(null);
  const value = getValues(field.hqlName);
  const fieldError = formState.errors[field.hqlName];
  const hasError = error || !!fieldError;

  // Separate register result to combine refs
  const { ref: registerRef, ...registerProps } = register(field.hqlName) as {
    ref: ((instance: HTMLInputElement | null) => void) | { current: HTMLInputElement | null };
    [key: string]: unknown;
  };

  // Combine our ref with react-hook-form's ref
  const handleDatetimeRef = useCallback(
    (node: HTMLInputElement | null) => {
      hiddenDatetimeInputRef.current = node;
      if (typeof registerRef === "function") {
        registerRef(node);
      } else if (registerRef && "current" in registerRef) {
        registerRef.current = node;
      }
    },
    [registerRef]
  );

  const datetimePlaceholder = useMemo(() => getLocaleDatetimePlaceholder(), []);

  // Sync the hidden datetime input value with the display value
  useEffect(() => {
    if (hiddenDatetimeInputRef.current) {
      const datetimeValue = hiddenDatetimeInputRef.current.value;
      if (datetimeValue) {
        // datetimeValue format: "2025-09-30T14:30" (from datetime-local input)
        const [datePart, timePart] = datetimeValue.split("T");
        // Format only the date part with locale (e.g., "09.30.2025" for Germany)
        const formattedDate = formatClassicDate(datePart, false);
        // Combine with time part
        const displayText = timePart ? `${formattedDate} ${timePart}` : formattedDate;
        setDisplayValue(displayText);
      } else {
        setDisplayValue("");
      }
    }
  }, [hiddenDatetimeInputRef.current?.value]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const handleDisplayInputFocus = useCallback(() => {
    if (!isReadOnly && hiddenDatetimeInputRef.current) {
      hiddenDatetimeInputRef.current.showPicker?.();
    }
  }, [isReadOnly]);

  const getInputClass = useCallback(() => {
    const baseClass = `w-full pl-3 pr-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 
        bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) 
        text-(--color-transparent-neutral-80) font-medium text-sm leading-5`;

    const focusClass = isFocused && !isReadOnly ? "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]" : "";

    const hoverClass = !isReadOnly
      ? "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)"
      : "";

    const readOnlyClass = isReadOnly
      ? "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)"
      : "";

    const errorClass = hasError ? "border-error-main" : "";

    return `${baseClass} ${focusClass} ${hoverClass} ${readOnlyClass} ${errorClass} focus:outline-none transition-colors`;
  }, [hasError, isFocused, isReadOnly]);

  const renderHelperText = useCallback(() => {
    const displayHelperText = helperText || (fieldError?.message as string);
    if (!displayHelperText) return null;

    return (
      <div className="h-0">
        <p className={`text-xs mt-1 ${hasError ? "text-red-500" : "text-baseline-60"}`}>{displayHelperText}</p>
      </div>
    );
  }, [hasError, helperText, fieldError]);

  return (
    <div className="w-full font-['Inter'] font-medium">
      <div className={`relative flex items-center w-full ${isReadOnly ? "pointer-events-none" : ""}`}>
        {/* Visible text input showing formatted datetime */}
        <input
          type="text"
          id={field.hqlName}
          value={displayValue}
          readOnly
          className={getInputClass()}
          onFocus={handleDisplayInputFocus}
          onBlur={handleBlur}
          aria-label={field.name}
          aria-readonly={isReadOnly || true}
          aria-required={field.isMandatory}
          aria-disabled={isReadOnly}
          aria-details={field.helpComment}
          placeholder={datetimePlaceholder}
        />
        {/* Hidden datetime-local input connected to react-hook-form - overlayed on visible input for correct picker positioning */}
        <input
          type="datetime-local"
          ref={handleDatetimeRef}
          {...registerProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          tabIndex={-1}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          value={value ? formatDateForInputSafe(value) : ""}
        />
        <div
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 pointer-events-none z-10 flex items-center justify-center ${
            isFocused && !isReadOnly ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
          }`}>
          <CalendarIcon fill={"currentColor"} className="h-5 w-5" data-testid={`CalendarIcon__${field.id}`} />
        </div>
      </div>
      {renderHelperText()}
    </div>
  );
};

export default DatetimeSelector;

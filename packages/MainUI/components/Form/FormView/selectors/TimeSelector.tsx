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
import { useState, useEffect, useMemo } from "react";
import ClockIcon from "@workspaceui/componentlibrary/src/assets/icons/clock.svg";

interface TimeSelectorProps {
  field: Field;
  isReadOnly?: boolean;
  label?: string;
  error?: boolean;
  helperText?: string;
}

export const TimeSelector = ({ field, isReadOnly, error, helperText, label }: TimeSelectorProps) => {
  const { setValue, formState, watch } = useFormContext();
  const [isFocused, setIsFocused] = useState(false);
  const fieldName = field.hqlName;

  // Watch value from form state to sync
  const formValue = watch(fieldName);
  const [displayValue, setDisplayValue] = useState<string>("");

  const fieldError = formState.errors[fieldName];
  const hasError = error || !!fieldError;

  // Sync display value with form value
  useEffect(() => {
    if (!formValue) {
      setDisplayValue("");
      return;
    }

    // Handle case where formValue might be the full ISO string we just set
    if (formValue.includes("T")) {
      const date = new Date(formValue);
      if (!Number.isNaN(date.getTime())) {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        setDisplayValue(`${hours}:${minutes}:${seconds}`);
      } else {
        setDisplayValue(formValue);
      }
    } else {
      setDisplayValue(formValue);
    }
  }, [formValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; // "HH:MM:SS" or "HH:MM"

    // Update display immediately
    setDisplayValue(timeValue);

    if (!timeValue) {
      setValue(fieldName, null, { shouldDirty: true, shouldValidate: true });
      return;
    }

    // Construct full date for payload
    const now = new Date();
    const [hours, minutes, seconds] = timeValue.split(":").map(Number);

    // Create date object with Today's date and Selected Local Time
    const dateToSave = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds || 0);

    const isoString = dateToSave.toISOString(); // e.g., 2026-01-28T14:30:00.000Z
    const formattedPayload = isoString.split(".")[0]; // 2026-01-28T14:30:00

    // Update the form value with the payload format
    setValue(fieldName, formattedPayload, { shouldDirty: true, shouldValidate: true });
  };

  const inputClassNames = useMemo(() => {
    const baseClass = `w-full pl-3 pr-10 rounded-t tracking-normal h-10.5 border-0 border-b-2 
      bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) 
      text-(--color-transparent-neutral-80) font-medium text-sm leading-5
      [&::-webkit-calendar-picker-indicator]:hidden
      [&::-moz-calendar-picker-indicator]:hidden`;

    const focusClass = isFocused && !isReadOnly ? "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]" : "";

    const hoverClass = !isReadOnly
      ? "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)"
      : "";

    const readOnlyClass = isReadOnly
      ? "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)"
      : "";

    const errorClass = hasError ? "border-error-main" : "";

    return `${baseClass} ${focusClass} ${hoverClass} ${readOnlyClass} ${errorClass} focus:outline-none transition-colors`;
  }, [isFocused, isReadOnly, hasError]);

  const buttonClassNames = useMemo(() => {
    const baseClasses =
      "absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform z-10 flex items-center justify-center";

    const colorClass = isFocused ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)";

    return `${baseClasses} ${colorClass}`;
  }, [isFocused]);

  const handleIconClick = () => {
    if (!isReadOnly) {
      const input = document.getElementById(fieldName) as HTMLInputElement;
      input?.showPicker();
      input?.focus();
    }
  };

  return (
    <div className="w-full font-['Inter'] font-medium">
      {label && (
        <label
          htmlFor={fieldName}
          className={`flex items-center gap-1 font-medium text-sm leading-5 tracking-normal transition-colors ${isFocused && !isReadOnly ? "text-(--color-baseline-100)" : "text-(--color-baseline-80)"}`}>
          {label}
          {field.isMandatory && <span className="text-error-main ml-1">*</span>}
        </label>
      )}

      <div className={`relative flex items-center w-full ${isReadOnly ? "pointer-events-none" : ""}`}>
        <input
          type="time"
          step="1" // Enable seconds
          id={fieldName}
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          className={inputClassNames}
          aria-label={field.name}
          aria-invalid={hasError}
        />

        <button
          type="button"
          onClick={handleIconClick}
          className={buttonClassNames}
          disabled={isReadOnly}
          tabIndex={-1}>
          <ClockIcon fill="currentColor" className="h-5 w-5" />
        </button>
      </div>

      {(helperText || fieldError?.message) && (
        <div className="h-0">
          <p className={`text-xs mt-1 ${hasError ? "text-red-500" : "text-baseline-60"}`}>
            {helperText || (fieldError?.message as string)}
          </p>
        </div>
      )}
    </div>
  );
};

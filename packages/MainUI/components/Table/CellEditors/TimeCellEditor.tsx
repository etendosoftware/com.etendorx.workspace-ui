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

import type React from "react";
import { useRef, useState, useEffect } from "react";
import type { CellEditorProps } from "../types/inlineEditing";
import ClockIcon from "@workspaceui/componentlibrary/src/assets/icons/clock.svg";

export const TimeCellEditor: React.FC<CellEditorProps> = ({
  value,
  onChange,
  onBlur,
  disabled,
  hasError,
  shouldAutoFocus,
  field,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Initialize display value from prop value
  useEffect(() => {
    if (!value) {
      setDisplayValue("");
      return;
    }

    const stringValue = String(value);

    // If it's a full ISO string (from a previous edit), extract time
    if (stringValue.includes("T")) {
      const date = new Date(stringValue);
      if (!Number.isNaN(date.getTime())) {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        setDisplayValue(`${hours}:${minutes}:${seconds}`);
      } else {
        setDisplayValue(stringValue);
      }
    } else {
      // Assuming it's already HH:MM:SS from API
      setDisplayValue(stringValue);
    }
  }, [value]);

  // Focus handling
  useEffect(() => {
    if (shouldAutoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
      setIsFocused(true);
    }
  }, [shouldAutoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setDisplayValue(timeValue);

    if (!timeValue) {
      onChange(null);
      return;
    }

    // Construct full date for payload using Today's date + Selected Time -> UTC
    const now = new Date();
    const [hours, minutes, seconds] = timeValue.split(":").map(Number);

    const dateToSave = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds || 0);

    const isoString = dateToSave.toISOString(); // e.g. 2026-01-28T14:30:00.000Z
    const formattedPayload = isoString.split(".")[0]; // 2026-01-28T14:30:00

    onChange(formattedPayload);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only trigger blur if we are moving focus outside the container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
      onBlur();
    }
  };

  const handleIconClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.showPicker();
      inputRef.current.focus();
    }
  };

  const inputClassNames = `
    w-full h-full px-2 py-1 text-sm bg-transparent border-none outline-none 
    ${disabled ? "cursor-not-allowed text-gray-400" : "text-gray-900"}
    font-medium font-['Inter']
    [&::-webkit-calendar-picker-indicator]:hidden
    [&::-moz-calendar-picker-indicator]:hidden
  `;

  return (
    <div
      ref={containerRef}
      className={`
        relative w-full h-full flex items-center bg-white border border-transparent rounded
        ${isFocused ? "ring-2 ring-primary-main ring-inset" : ""}
        ${hasError ? "bg-red-50" : ""}
      `}>
      <input
        ref={inputRef}
        type="time"
        step="1"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={disabled}
        className={inputClassNames}
        aria-label={field?.name || "Time Input"}
      />

      {!disabled && (
        <button
          type="button"
          onClick={handleIconClick}
          className="absolute right-2 p-0.5 text-gray-500 hover:text-primary-main focus:outline-none flex items-center justify-center"
          tabIndex={-1}>
          <ClockIcon fill="currentColor" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

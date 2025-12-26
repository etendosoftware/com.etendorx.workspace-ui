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
import { forwardRef, useCallback, useRef, useState, useEffect, useMemo } from "react";
import CalendarIcon from "../../../../../../ComponentLibrary/src/assets/icons/calendar.svg";
import { formatClassicDate, getLocaleDatePlaceholder } from "@workspaceui/componentlibrary/src/utils/dateFormatter";
import { autocompleteDate } from "@/utils/dateAutocomplete";

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isReadOnly?: boolean;
  error?: boolean;
  helperText?: string;
  field: Field;
  currentValue?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ name, label, isReadOnly, error, helperText, field, currentValue, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hiddenDateInputRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [displayValue, setDisplayValue] = useState<string>("");

    const datePlaceholder = useMemo(() => getLocaleDatePlaceholder(), []);

    const labelClassNames = useMemo(() => {
      const baseClasses = "flex items-center gap-1 font-medium text-sm leading-5 tracking-normal transition-colors";

      let textColorClass: string;
      if (isFocused && !isReadOnly) {
        textColorClass = "text-(--color-baseline-100)";
      } else if (isReadOnly) {
        textColorClass = "text-baseline-60";
      } else {
        textColorClass = "text-(--color-baseline-80)";
      }

      return `${baseClasses} ${textColorClass}`;
    }, [isFocused, isReadOnly]);

    const inputClassNames = useMemo(() => {
      const baseClass = `w-full pl-3 pr-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 
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

      const errorClass = error ? "border-error-main" : "";

      return `${baseClass} ${focusClass} ${hoverClass} ${readOnlyClass} ${errorClass} focus:outline-none transition-colors`;
    }, [error, isFocused, isReadOnly]);

    const buttonClassNames = useMemo(() => {
      const baseClasses =
        "absolute right-3 top-1/2 transform -translate-y-1/2 transition-transform z-10 flex items-center justify-center";

      const colorClass = isFocused ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)";

      return `${baseClasses} ${colorClass}`;
    }, [isFocused]);

    const helperTextClassNames = useMemo(() => {
      const baseClass = "text-xs mt-1";
      const colorClass = error ? "text-red-500" : "text-baseline-60";

      return `${baseClass} ${colorClass}`;
    }, [error]);

    const handleCalendarClick = useCallback(() => {
      if (!isReadOnly && hiddenDateInputRef.current) {
        hiddenDateInputRef.current.showPicker();
        hiddenDateInputRef.current.focus();
      }
    }, [isReadOnly]);

    const handleRef = useCallback(
      (node: HTMLInputElement | null) => {
        if (node) {
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    const setNativeInputValue = useCallback((value: string) => {
      if (!hiddenDateInputRef.current) return;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeInputValueSetter?.call(hiddenDateInputRef.current, value);

      const event = new Event("change", { bubbles: true });
      hiddenDateInputRef.current.dispatchEvent(event);
    }, []);

    const handleValidDateInput = useCallback(
      (isoDate: string) => {
        if (!hiddenDateInputRef.current) return;

        if (hiddenDateInputRef.current.value !== isoDate) {
          setNativeInputValue(isoDate);
        }

        setDisplayValue(formatClassicDate(isoDate, false));
      },
      [setNativeInputValue]
    );

    const handleInvalidDateInput = useCallback(() => {
      if (hiddenDateInputRef.current?.value) {
        setNativeInputValue("");
      }
    }, [setNativeInputValue]);

    const handleEmptyInput = useCallback(() => {
      if (hiddenDateInputRef.current?.value) {
        setNativeInputValue("");
      }
    }, [setNativeInputValue]);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!containerRef.current?.contains(relatedTarget)) {
          setIsFocused(false);
        }

        if (!isReadOnly && displayValue) {
          const date = autocompleteDate(displayValue, datePlaceholder);
          if (date) {
            const isoDate = date.toISOString().split("T")[0];
            handleValidDateInput(isoDate);
          } else {
            handleInvalidDateInput();
          }
        } else if (!displayValue) {
          handleEmptyInput();
        }

        props.onBlur?.(e);
      },
      [props, displayValue, isReadOnly, datePlaceholder, handleValidDateInput, handleInvalidDateInput, handleEmptyInput]
    );

    // Sync the hidden date input value with the display value
    useEffect(() => {
      if (hiddenDateInputRef.current) {
        const isoValue = hiddenDateInputRef.current.value;
        // Only update display value if it's not currently being edited (focused)
        // OR if the isoValue corresponds to what is currently displayed (to avoid overwriting user typing)
        // Actually, we should update if the external value changes.
        // But we need to be careful not to fight with user typing.
        // The `value` prop from react-hook-form is passed via `...props` to the hidden input.
        // So `hiddenDateInputRef.current.value` reflects the form state.

        if (isoValue) {
          const formatted = formatClassicDate(isoValue, false);
          // Only update display value if it differs and we are not focused (or if it's a completely new value)
          // To keep it simple: if we are not focused, always sync.
          if (!isFocused) {
            setDisplayValue(formatted);
          }
        } else if (!isFocused) {
          setDisplayValue("");
        }
      }
    }, [currentValue, isFocused]); // props.value should be the controlled value

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsFocused(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const renderLabel = useCallback(() => {
      if (!label) return null;

      return (
        <label htmlFor={name} className={labelClassNames}>
          {label}
          {field.isMandatory && <span className="text-error-main ml-1">*</span>}
        </label>
      );
    }, [labelClassNames, label, name, field.isMandatory]);

    const renderHelperText = useCallback(() => {
      if (!helperText) return null;

      return (
        <div className="h-0">
          <p className={helperTextClassNames}>{helperText}</p>
        </div>
      );
    }, [helperText, helperTextClassNames]);

    const handleDisplayInputFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleDisplayInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setDisplayValue(newValue);

        // Attempt to autocomplete the date as the user types
        const date = autocompleteDate(newValue, datePlaceholder);
        if (date) {
          // Check if the input has at least 3 parts (Day, Month, Year)
          // This prevents triggering on "1" (Day only) or "10/10" (Day/Month only)
          // which are valid via autocomplete but likely incomplete during typing.
          const parts = newValue.trim().split(/[\/\.\-]/);
          if (parts.length < 3) {
            return;
          }

          const isoDate = date.toISOString().split("T")[0];
          // If we have a valid date, update the hidden input
          // This will trigger handleHiddenDateChange -> props.onChange -> callout
          if (hiddenDateInputRef.current && hiddenDateInputRef.current.value !== isoDate) {
            setNativeInputValue(isoDate);
          }
        }
      },
      [datePlaceholder, setNativeInputValue]
    );

    const handleHiddenDateChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        props.onChange?.(e);
        // Also update display value immediately if picked from calendar
        // But NOT if we are typing (isFocused), to avoid disrupting user input
        if (e.target.value && !isFocused) {
          setDisplayValue(formatClassicDate(e.target.value, false));
        }
      },
      [props]
    );

    return (
      <div ref={containerRef} className="w-full font-['Inter'] font-medium">
        {renderLabel()}
        <div className={`relative flex items-center w-full ${isReadOnly ? "pointer-events-none" : ""}`}>
          {/* Visible text input showing formatted date */}
          <input
            type="text"
            id={name}
            value={displayValue}
            readOnly={isReadOnly}
            className={inputClassNames}
            onFocus={handleDisplayInputFocus}
            onBlur={handleBlur}
            onChange={handleDisplayInputChange}
            aria-label={field.name}
            aria-readonly={isReadOnly || true}
            aria-required={field.isMandatory}
            aria-disabled={isReadOnly}
            aria-details={field.helpComment}
            placeholder={datePlaceholder}
          />
          {/* Hidden date input connected to react-hook-form */}
          <input
            type="date"
            ref={(node) => {
              hiddenDateInputRef.current = node;
              handleRef(node);
            }}
            name={name}
            onChange={handleHiddenDateChange}
            className="sr-only"
            tabIndex={-1}
            readOnly={isReadOnly}
            disabled={isReadOnly}
            {...props}
          />
          <button type="button" onClick={handleCalendarClick} className={buttonClassNames} disabled={isReadOnly}>
            <CalendarIcon fill={"currentColor"} className="h-5 w-5" data-testid="CalendarIcon__417e7f" />
          </button>
        </div>
        {renderHelperText()}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;

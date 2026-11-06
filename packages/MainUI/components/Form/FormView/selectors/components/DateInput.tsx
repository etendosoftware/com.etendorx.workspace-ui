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
import { formatLocalIsoDate } from "@/utils/date/localDate";
import { NOT_TABBABLE } from "@/utils/form/focus";
import {
  getInputClassNames,
  getButtonClassNames,
  getLabelClassNames,
  getHelperTextClassNames,
} from "@/utils/date/constants";

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

    const labelClassNames = useMemo(() => getLabelClassNames({ isFocused, isReadOnly }), [isFocused, isReadOnly]);

    const inputClassNames = useMemo(
      () => getInputClassNames({ isFocused, isReadOnly, hasError: error }),
      [error, isFocused, isReadOnly]
    );

    const buttonClassNames = useMemo(() => getButtonClassNames({ isFocused }), [isFocused]);

    const helperTextClassNames = useMemo(() => getHelperTextClassNames({ hasError: error }), [error]);

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

    // A typed date is applied only when the user finishes typing (leaves the field or presses Enter), never
    // on each keystroke: partial dates such as 15/08/2 would be applied, saved and sent to the callouts.
    const commitTypedDate = useCallback(() => {
      if (!isReadOnly && displayValue) {
        const date = autocompleteDate(displayValue, datePlaceholder);
        if (date) {
          // The calendar day typed, not its UTC conversion, which shifts it east of UTC
          handleValidDateInput(formatLocalIsoDate(date));
        } else {
          handleInvalidDateInput();
        }
      } else if (!displayValue) {
        handleEmptyInput();
      }
    }, [displayValue, isReadOnly, datePlaceholder, handleValidDateInput, handleInvalidDateInput, handleEmptyInput]);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!containerRef.current?.contains(relatedTarget)) {
          setIsFocused(false);
        }

        commitTypedDate();

        props.onBlur?.(e);
      },
      [props, commitTypedDate]
    );

    const handleDisplayInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          commitTypedDate();
        }
      },
      [commitTypedDate]
    );

    // Sync the hidden date input value with the display value
    useEffect(() => {
      // Use the explicitly passed currentValue if available, otherwise fallback to the native input value
      const isoValue = currentValue || hiddenDateInputRef.current?.value || "";

      if (isoValue && !isFocused) {
        setDisplayValue(formatClassicDate(isoValue, false));
      } else if (!isoValue && !isFocused) {
        setDisplayValue("");
      }
    }, [currentValue]);

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

    // Typing only edits the visible text; the date is applied by commitTypedDate
    const handleDisplayInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayValue(e.target.value);
    }, []);

    const handleHiddenDateChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        props.onChange?.(e);
        if (e.target.value) {
          setDisplayValue(formatClassicDate(e.target.value, false));
        } else {
          setDisplayValue("");
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
            // Disabled — not merely read-only — so the field leaves the tab
            // sequence, matching how Classic renders a read-only form item.
            disabled={isReadOnly}
            className={inputClassNames}
            onFocus={handleDisplayInputFocus}
            onBlur={handleBlur}
            onChange={handleDisplayInputChange}
            onKeyDown={handleDisplayInputKeyDown}
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
            {...props}
            ref={(node) => {
              hiddenDateInputRef.current = node;
              handleRef(node);
            }}
            name={name}
            onChange={handleHiddenDateChange}
            className="sr-only"
            tabIndex={NOT_TABBABLE}
            readOnly={isReadOnly}
            disabled={isReadOnly}
          />
          <button
            type="button"
            onClick={handleCalendarClick}
            className={buttonClassNames}
            disabled={isReadOnly}
            tabIndex={NOT_TABBABLE}>
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

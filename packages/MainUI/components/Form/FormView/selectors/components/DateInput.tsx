import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import type { Field } from "@workspaceui/etendohookbinder/src/api/types";
import { forwardRef, useCallback, useRef, useState } from "react";
import CalendarIcon from "../../../../../../ComponentLibrary/src/assets/icons/calendar.svg";

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isReadOnly?: boolean;
  error?: boolean;
  helperText?: string;
  field: Field;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ name, label, isReadOnly, error, helperText, field, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>();
    const [isFocused, setIsFocused] = useState(false);

    const handleCalendarClick = useCallback(() => {
      if (!isReadOnly && inputRef.current) {
        inputRef.current.showPicker();
      }
    }, [isReadOnly]);

    const handleRef = useCallback(
      (node: HTMLInputElement) => {
        if (node) {
          inputRef.current = node;
        }

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const handleFocus = useCallback(() => setIsFocused(true), []);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        props.onBlur?.(e);
      },
      [props],
    );

    const getLabelClass = useCallback(
      () => `block mb-1 text-sm ${isReadOnly ? "text-baseline-60" : "text-baseline-80"}`,
      [isReadOnly],
    );

    const getInputClass = useCallback(() => {
      const baseClass = "w-full h-full py-2 pl-2 pr-10 border-b outline-none text-sm";
      const focusClass = isFocused ? "border-baseline-80 bg-baseline-0" : "border-baseline-60";
      const readOnlyClass = isReadOnly
        ? "bg-transparent-neutral-20 rounded-t-lg cursor-not-allowed"
        : "bg-transparent text-baseline-90 hover:border-baseline-80";
      const errorClass = error ? "border-error-main" : "";

      return `${baseClass} ${focusClass} ${readOnlyClass} ${errorClass} transition-colors`;
    }, [error, isFocused, isReadOnly]);

    const renderLabel = useCallback(() => {
      if (!label) return null;

      return (
        <label htmlFor={name} className={getLabelClass()}>
          {label}
          {props.required && <span className="text-error-main ml-1">*</span>}
        </label>
      );
    }, [getLabelClass, label, name, props.required]);

    const renderHelperText = useCallback(() => {
      if (!helperText) return null;

      return <div className={`mt-1 text-xs ${error ? "text-error-main" : "text-baseline-60"}`}>{helperText}</div>;
    }, [error, helperText]);

    return (
      <div className="w-full font-medium">
        {renderLabel()}
        <div className="relative w-full h-10 flex items-center">
          <input
            type="date"
            id={name}
            name={name}
            ref={handleRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={getInputClass()}
            readOnly={isReadOnly}
            aria-label={field.name}
            aria-readonly={isReadOnly}
            aria-required={field.isMandatory}
            aria-disabled={isReadOnly}
            aria-details={field.helpComment}
            {...props}
          />
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <IconButton onClick={handleCalendarClick} disabled={isReadOnly} className="w-8 h-8">
              <CalendarIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
        {renderHelperText()}
      </div>
    );
  },
);

DateInput.displayName = "DateInput";

export default DateInput;

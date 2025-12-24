import { useState, useMemo, type ChangeEvent } from "react";
import X from "../../../../../../ComponentLibrary/src/assets/icons/x.svg";
import type { TextAreaInputProps } from "./types";

export const TextAreaInput = ({
  leftIcon,
  rightIcon,
  onLeftIconClick,
  onRightIconClick,
  label,
  readOnly,
  disabled,
  className,
  onChange,
  field,
  endAdornment,
  errorText,
  showClearButton = true,
  onClear,
  setValue,
  rows,
  ...props
}: TextAreaInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = disabled || readOnly;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    }
  };

  const labelClassNames = useMemo(() => {
    const base = "flex items-center gap-1 font-medium text-sm leading-5 tracking-normal transition-colors";

    let color = "text-(--color-baseline-80)";

    if (isFocused && !isDisabled) {
      color = "text-(--color-baseline-100)";
    } else if (isDisabled) {
      color = "text-baseline-60";
    }

    return `${base} ${color}`;
  }, [isFocused, isDisabled]);

  const textareaBaseClassNames = useMemo(() => {
    const paddingLeft = leftIcon ? "pl-10" : "pl-3";
    const paddingRight = showClearButton || rightIcon ? "pr-10" : "pr-3";

    const baseClasses = `w-full ${paddingLeft} ${paddingRight} py-2 rounded-t tracking-normal resize-none
      border-0 border-b-2 bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) 
      text-(--color-transparent-neutral-80) font-medium text-sm leading-5 
      focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none 
      hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)`;

    const disabledStyles =
      "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40)";
    return isDisabled ? `${baseClasses} ${disabledStyles}` : baseClasses;
  }, [leftIcon, showClearButton, rightIcon, isDisabled]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleClear = () => {
    if (setValue) {
      setValue("");
    }
    if (onClear) onClear();
  };

  const finalClassName = className ? `${textareaBaseClassNames} ${className}` : textareaBaseClassNames;
  const currentValue = props.value ?? "";
  const showClear = showClearButton && !!currentValue && !isDisabled;

  // Separate value from other props to ensure it's never null
  const { value: _, ...restProps } = props;

  return (
    <div className="w-full font-['Inter'] font-medium">
      {label && (
        <label htmlFor={props.id || props.name} className={labelClassNames}>
          {label}
          {field.isMandatory && <span className="text-error-main ml-1">*</span>}
        </label>
      )}
      <div className={`relative flex w-full ${isDisabled ? "pointer-events-none" : ""}`}>
        {leftIcon && (
          <div className="absolute top-2 left-0 pl-3 flex items-start">
            <button type="button" onClick={onLeftIconClick} className="p-1 focus:outline-none" disabled={isDisabled}>
              {leftIcon}
            </button>
          </div>
        )}

        <textarea
          className={finalClassName}
          disabled={isDisabled}
          readOnly={readOnly}
          rows={rows}
          aria-label={field.name}
          aria-required={field.isMandatory}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={currentValue}
          {...restProps}
        />

        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-2 p-1 hover:text-gray-600 transition-colors z-10 flex items-center justify-center">
            <X className="h-4 w-4 text-gray-400" data-testid={`X__${field.id}`} />
          </button>
        )}

        {endAdornment}
      </div>
      <div className="h-0">{errorText && <p className="text-xs text-red-500 mt-1">{errorText}</p>}</div>
    </div>
  );
};

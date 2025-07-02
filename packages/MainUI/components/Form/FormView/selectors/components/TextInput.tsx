import type { ChangeEvent } from "react";
import type { TextInputProps } from "./types";

export const TextInput = ({
  leftIcon,
  rightIcon,
  onLeftIconClick,
  onRightIconClick,
  label,
  setValue,
  readOnly,
  disabled,
  className,
  onChange,
  field,
  endAdornment,
  errorText,
  ...props
}: TextInputProps) => {
  const isDisabled = disabled || readOnly;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (setValue) {
      setValue(event.target.value);
    }
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <div className="w-full font-['Inter'] font-medium">
      {label && (
        <label
          htmlFor={props.id || props.name}
          className={`block mb-1 text-sm ${isDisabled ? "text-baseline-60" : "text-baseline-80"}`}>
          {label}
          {field.isMandatory && <span className="text-error-main ml-1">*</span>}
        </label>
      )}
      <div className={`relative flex items-center w-full h-10 ${isDisabled ? "pointer-events-none" : ""}`}>
        {leftIcon && (
          <div className="absolute left-3 text-baseline-60">
            <button type="button" onClick={onLeftIconClick} className="p-1 focus:outline-none" disabled={isDisabled}>
              {leftIcon}
            </button>
          </div>
        )}
        <input
          className={`w-full h-full py-2 border-b outline-none text-sm transition-colors
            ${leftIcon ? "pl-10" : "pl-3"} 
            ${rightIcon ? "pr-10" : "pr-3"}
            ${isDisabled ? "bg-transparent-neutral-20 rounded-t-lg cursor-not-allowed" : "bg-transparent text-baseline-90 hover:border-baseline-80"}
            ${className || ""}`}
          onChange={handleChange}
          disabled={isDisabled}
          readOnly={readOnly}
          aria-label={field.name}
          aria-required={field.isMandatory}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-baseline-60">
            <button type="button" onClick={onRightIconClick} className="p-1 focus:outline-none" disabled={isDisabled}>
              {rightIcon}
            </button>
          </div>
        )}
        {endAdornment}
      </div>
      <div className="h-5">{errorText && <p className="text-xs text-red-500 mt-1">{errorText}</p>}</div>
    </div>
  );
};

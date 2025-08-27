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
import { useState, type ChangeEvent } from "react";
import X from "../../../../../../ComponentLibrary/src/assets/icons/x.svg";
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
  showClearButton = true,
  onClear,
  ...props
}: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(props.value || "");
  const isDisabled = disabled || readOnly;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);

    if (setValue) {
      setValue(newValue);
    }
    if (onChange) {
      onChange(event);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const handleClear = () => {
    setInternalValue("");
    if (setValue) {
      setValue("");
    }
    if (onClear) {
      onClear();
    }
  };

  const getRightPadding = () => {
    if (showClearButton || rightIcon) return "pr-10";
    return "pr-3";
  };

  const currentValue = props.value ?? internalValue ?? "";

  const shouldShowClearButton = showClearButton && currentValue && !isDisabled;

  const baseClassName = `w-full ${leftIcon ? "pl-10" : "pl-3"} ${getRightPadding()} rounded-t tracking-normal h-10.5 border-0 border-b-2 bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 
     focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none 
     hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)
     ${isDisabled ? "bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)" : ""}
   `;

  const finalClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <div className="w-full font-['Inter'] font-medium">
      {label && (
        <label
          htmlFor={props.id || props.name}
          className={`flex items-center gap-1 font-medium text-sm leading-5 tracking-normal transition-colors ${
            isFocused && !isDisabled
              ? "text-(--color-baseline-100)"
              : isDisabled
                ? "text-baseline-60"
                : "text-(--color-baseline-80)"
          }`}>
          {label}
          {field.isMandatory && <span className="text-error-main ml-1">*</span>}
        </label>
      )}
      <div className={`relative flex items-center w-full ${isDisabled ? "pointer-events-none" : ""}`}>
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <button
              type="button"
              onClick={onLeftIconClick}
              className={`p-1 focus:outline-none transition-colors ${
                isFocused && !isDisabled ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
              }`}
              disabled={isDisabled}>
              {leftIcon}
            </button>
          </div>
        )}
        <input
          className={finalClassName}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isDisabled}
          readOnly={readOnly}
          aria-label={field.name}
          aria-required={field.isMandatory}
          value={currentValue}
          {...props}
        />
        {shouldShowClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:text-gray-600 transition-colors z-10 flex items-center justify-center">
            <X
              className={`h-4 w-4 transition-colors ${
                isFocused ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
              }`}
            />
          </button>
        )}
        {!shouldShowClearButton && rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={onRightIconClick}
              className={`p-1 focus:outline-none transition-colors ${
                isFocused && !isDisabled ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
              }`}
              disabled={isDisabled}>
              {rightIcon}
            </button>
          </div>
        )}
        {endAdornment}
      </div>
      <div className="h-0">{errorText && <p className="text-xs text-red-500 mt-1">{errorText}</p>}</div>
    </div>
  );
};

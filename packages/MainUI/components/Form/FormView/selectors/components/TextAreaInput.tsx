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

  const maxLength = useMemo<number | undefined>(() => {
    const raw = field?.column?.length;
    if (!raw) return undefined;
    const parsed = Number(raw);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : undefined;
  }, [field]);

  const charCount = currentValue.length;

  const counterColorClass = useMemo<string>(() => {
    if (maxLength === undefined) return "";
    const ratio = charCount / maxLength;
    if (ratio >= 1) return "text-red-500";
    if (ratio > 0.8) return "text-orange-400";
    return "text-(--color-baseline-60)";
  }, [charCount, maxLength]);

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
          maxLength={maxLength}
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
      {maxLength !== undefined && !isDisabled && (
        <p className={`text-xs mt-1 text-right ${counterColorClass}`} data-testid="char-counter">
          {charCount} / {maxLength}
        </p>
      )}
    </div>
  );
};

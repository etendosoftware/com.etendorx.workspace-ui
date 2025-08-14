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

import { type ChangeEvent, forwardRef } from "react";
import type { TextInputProps } from "./types";

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
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
    },
    ref
  ) => {
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
            ref={ref}
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
  }
);

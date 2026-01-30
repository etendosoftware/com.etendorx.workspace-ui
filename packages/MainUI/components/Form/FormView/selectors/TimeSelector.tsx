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
import { formatUTCTimeToLocal, formatLocalTimeToUTCPayload } from "@/utils/date/utils";
import { getInputClassNames, getButtonClassNames, getLabelClassNames } from "@/utils/date/constants";

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

  // Sync display value with form value (convert UTC to Local)
  useEffect(() => {
    if (!formValue) {
      setDisplayValue("");
      return;
    }

    const localTime = formatUTCTimeToLocal(String(formValue));
    setDisplayValue(localTime);
  }, [formValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value; // "HH:MM:SS" or "HH:MM"

    // Update display immediately
    setDisplayValue(timeValue);

    if (!timeValue) {
      setValue(fieldName, null, { shouldDirty: true, shouldValidate: true });
      return;
    }

    // Convert local time to UTC payload
    const utcPayload = formatLocalTimeToUTCPayload(timeValue);
    setValue(fieldName, utcPayload, { shouldDirty: true, shouldValidate: true });
  };

  const inputClassNames = useMemo(
    () => getInputClassNames({ isFocused, isReadOnly, hasError }),
    [isFocused, isReadOnly, hasError]
  );

  const buttonClassNames = useMemo(() => getButtonClassNames({ isFocused }), [isFocused]);

  const labelClassNames = useMemo(() => getLabelClassNames({ isFocused, isReadOnly }), [isFocused, isReadOnly]);

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
        <label htmlFor={fieldName} className={labelClassNames}>
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
          <ClockIcon fill="currentColor" className="h-5 w-5" data-testid={"ClockIcon__" + field.id} />
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

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

import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { validateNumber } from "@workspaceui/componentlibrary/src/utils/quantitySelectorUtil";
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldValue, QuantityProps } from "../types";
import { TextInput } from "./components/TextInput";
import { IconButton } from "@workspaceui/componentlibrary/src/components";

const EndAdormentQuantity = () => {
  return (
    <div className="flex flex-row h-full">
      <IconButton
        className="w-6 rounded-0 hover:bg-[rgba(0,0,0,0.04)] hover:text-[rgba(0,0,0,0.4)]"
        onClick={(e) => {
          e.stopPropagation();
          const input = e.currentTarget.parentElement?.parentElement?.querySelector("input");
          if (input) {
            input.stepUp();
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }}>
        <AddIcon fontSize="small" />
      </IconButton>
      <IconButton
        className="w-6 rounded-0 hover:bg-[rgba(0,0,0,0.04)] hover:text-[rgba(0,0,0,0.4)]"
        onClick={(e) => {
          e.stopPropagation();
          const input = e.currentTarget.parentElement?.parentElement?.querySelector("input");
          const inputValue = input?.value;
          if (input && inputValue && Number(inputValue) > 0) {
            input.stepDown();
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }}>
        <RemoveIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

const DEFAULT_STEP = "any";
const DEFAULT_TYPE = "decimal";

const QuantitySelector: React.FC<QuantityProps> = memo(
  ({ value: initialValue, min, max, onChange, readOnly, maxLength = 100, name, field }) => {
    const { watch, setValue: setActualValue } = useFormContext();
    const value = watch(field.hqlName, initialValue || "");

    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const setValue = useCallback(
      (value: FieldValue) => {
        if (value === null || value === "") {
          setActualValue(field.hqlName, null);
          return;
        }

        const valueAsString = String(value);

        if (valueAsString.endsWith(".")) {
          setActualValue(field.hqlName, valueAsString);
          return;
        }

        const numValue = Number.parseFloat(valueAsString);
        if (!Number.isNaN(numValue)) {
          setActualValue(field.hqlName, numValue);
        }
      },
      [field.hqlName, setActualValue]
    );

    const minValue = min !== null && min !== undefined && min !== "" ? Number(min) : undefined;
    const maxValue = max !== null && max !== undefined && max !== "" ? Number(max) : undefined;

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;
        const sanitizedValue = inputValue.replace(/[^\d.]/g, "").slice(0, Number(maxLength));

        setValue(sanitizedValue);

        if (sanitizedValue === "") {
          setError(false);
          setErrorMessage("");
          onChange?.(null);
          return;
        }
      },
      [maxLength, setValue, onChange]
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (["e", "E", "+", "-"].concat(DEFAULT_TYPE === "decimal" ? [] : ["."]).includes(event.key)) {
        event.preventDefault();
      }
    }, []);

    const handleBlur = useCallback(() => {
      const defaultValue = !value || value === "" ? 0 : value;
      if (!defaultValue && field.isMandatory) {
        setValue(minValue ?? defaultValue);
      }
      const { isValid, errorMessage } = validateNumber(String(defaultValue), minValue, maxValue);
      setError(!isValid);
      setErrorMessage(errorMessage);
    }, [field, value, setValue, minValue, maxValue]);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue, setValue]);

    return (
      <TextInput
        field={field}
        type={DEFAULT_TYPE}
        step={DEFAULT_TYPE === "decimal" ? DEFAULT_STEP : undefined}
        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={readOnly}
        name={name}
        endAdornment={DEFAULT_TYPE === "decimal" ? undefined : <EndAdormentQuantity />}
        errorText={error ? errorMessage : " "}
        role="spinbutton"
        aria-readonly={readOnly}
        aria-disabled={readOnly}
        {...(typeof minValue !== "undefined" ? { "aria-valuemin": minValue } : {})}
        {...(typeof maxValue !== "undefined" ? { "aria-valuemax": maxValue } : {})}
      />
    );
  }
);

QuantitySelector.displayName = "QuantitySelector";

export default QuantitySelector;

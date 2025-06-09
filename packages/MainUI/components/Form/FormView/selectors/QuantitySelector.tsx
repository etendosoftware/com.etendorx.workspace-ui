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

const QuantitySelector: React.FC<QuantityProps> = memo(
  ({ value: initialValue, min, max, onChange, readOnly, maxLength = 100, name, field }) => {
    const { watch, setValue: setActualValue } = useFormContext();
    const value = watch(field.hqlName, initialValue || "");

    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const setValue = useCallback(
      (v: FieldValue) => {
        setActualValue(field.hqlName, v === "" || v === null ? null : Number(v));
      },
      [field.hqlName, setActualValue]
    );

    const minValue = min !== null && min !== undefined && min !== "" ? Number(min) : undefined;
    const maxValue = max !== null && max !== undefined && max !== "" ? Number(max) : undefined;

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;

        const sanitizedValue = inputValue.replace(/[^\d]/g, "").slice(0, Number(maxLength));

        setValue(sanitizedValue);

        if (sanitizedValue === "") {
          setError(false);
          setErrorMessage("");
          onChange?.(null);
          return;
        }

        const { isValid, errorMessage, roundedValue } = validateNumber(sanitizedValue, minValue, maxValue);
        setError(!isValid);
        setErrorMessage(errorMessage);

        if (isValid && roundedValue !== undefined) {
          setValue(roundedValue.toString());
          onChange?.(roundedValue);
        }
      },
      [maxLength, setValue, minValue, maxValue, onChange]
    );

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (["e", "E", "+", "-"].includes(event.key)) {
        event.preventDefault();
      }
    }, []);

    const handleBlur = useCallback(() => {
      if ((!value || value === "") && field.isMandatory) {
        setValue(minValue ?? 0);
      }
    }, [field, value, minValue, setValue]);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue, setValue]);

    return (
      <TextInput
        field={field}
        type="number"
        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={readOnly}
        name={name}
        endAdornment={<EndAdormentQuantity />}
        helperText={error ? errorMessage : " "}
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

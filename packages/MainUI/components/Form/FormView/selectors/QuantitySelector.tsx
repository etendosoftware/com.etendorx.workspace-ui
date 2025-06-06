import { TextField, IconButton, Box } from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { validateNumber } from "@workspaceui/componentlibrary/src/utils/quantitySelectorUtil";
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldValue, QuantityProps } from "../types";

const INPUT_PROPS = {
  inputProps: {
    inputMode: "numeric" as const,
    pattern: "[0-9]*",
  },
  // Hide default buttons on number inputs
  sx: {
    "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
      display: "none",
    },
    "& input[type=number]": {
      MozAppearance: "textfield",
    },
  },
  endAdornment: (
    <Box sx={{ display: "flex", flexDirection: "row", height: "100%" }}>
      <IconButton
        size="small"
        sx={{
          width: "24px",
          borderRadius: 0,
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
        }}
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
        size="small"
        sx={{
          width: "24px",
          borderRadius: 0,
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
        }}
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
    </Box>
  ),
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
        setValue(0);
      }
    }, [field, value]);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue, setValue]);

    return (
      <TextField
        id="outlined-number"
        type="number"
        variant="standard"
        margin="normal"
        fullWidth
        onBlur={handleBlur}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        error={error}
        helperText={error ? errorMessage : " "}
        disabled={readOnly}
        InputProps={INPUT_PROPS}
        name={name}
        role="spinbutton"
        aria-label={field.name}
        aria-readonly={readOnly}
        aria-required={field.isMandatory}
        aria-disabled={readOnly}
        {...(typeof minValue !== "undefined" ? { "aria-valuemin": minValue } : {})}
        {...(typeof maxValue !== "undefined" ? { "aria-valuemax": maxValue } : {})}
      />
    );
  }
);

QuantitySelector.displayName = "QuantitySelector";

export default QuantitySelector;

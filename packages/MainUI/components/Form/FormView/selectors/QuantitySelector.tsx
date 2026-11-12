import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext, useWatch } from "react-hook-form";
import { useCallback, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language";
import { validateNumber } from "@workspaceui/componentlibrary/src/utils/quantitySelectorUtil";
import { useTranslation } from "@/hooks/useTranslation";
import { evaluateMathExpression, isMathExpression, sanitizeMathExpression } from "@/utils/form/mathExpression";

interface QuantitySelectorProps {
  field: Field;
  min?: number | string;
  max?: number | string;
  allowNegative?: boolean;
  isReadOnly?: boolean;
}

export const QuantitySelector = ({ field, min, max, allowNegative = false, isReadOnly }: QuantitySelectorProps) => {
  const { setValue } = useFormContext();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const fieldName = field.hqlName;
  const formValue = useWatch({ name: fieldName });
  const [localValue, setLocalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  // Message of the last expression that could not be evaluated or is not allowed in this field.
  const [entryError, setEntryError] = useState<string | undefined>(undefined);

  const getDecimalSeparator = useCallback(() => {
    return language === "es_ES" ? "," : ".";
  }, [language]);

  const normalizeDecimalInput = useCallback((value: string): string => {
    return value.replace(",", ".");
  }, []);

  const formatDisplayValue = useCallback(
    (value: number): string => {
      const separator = getDecimalSeparator();
      return String(value).replace(".", separator);
    },
    [getDecimalSeparator]
  );

  const getDisplayValue = useCallback(() => {
    // An expression that could not be evaluated keeps the text the user typed, so it can be corrected.
    if (isFocused || entryError) {
      return localValue;
    }

    if (formValue !== null && formValue !== undefined) {
      return formatDisplayValue(Number(formValue));
    }

    return "";
  }, [isFocused, entryError, localValue, formValue, formatDisplayValue]);

  const displayValue = getDisplayValue();

  useEffect(() => {
    if (!isFocused && !entryError) {
      setLocalValue(displayValue);
    }
  }, [formValue, isFocused, entryError, displayValue]);

  const isValidIntermediateValue = useCallback((value: string): boolean => {
    return /^-?\d*[.,]?\d*$/.test(value);
  }, []);

  const handleSetValue = useCallback(
    (value: string) => {
      setEntryError(undefined);

      // "=2*5" is an arithmetic expression, evaluated when the field is left.
      if (isMathExpression(value)) {
        setLocalValue(sanitizeMathExpression(value));
        return;
      }

      const sanitized = value.replace(/[^\d.,-]/g, "");

      setLocalValue(sanitized);

      if (sanitized === "") {
        setValue(fieldName, null, { shouldValidate: true });
        return;
      }

      if (!isValidIntermediateValue(sanitized)) {
        return;
      }

      const normalizedValue = normalizeDecimalInput(sanitized);

      if (normalizedValue.endsWith(".") || normalizedValue === "" || normalizedValue === "-") {
        return;
      }
      const minValue = min ? Number(min) : undefined;
      const maxValue = max ? Number(max) : undefined;

      const { isValid } = validateNumber(normalizedValue, minValue, maxValue, allowNegative);

      if (isValid) {
        setValue(fieldName, Number(normalizedValue), { shouldValidate: true });
      }
    },
    [fieldName, min, max, setValue, normalizeDecimalInput, isValidIntermediateValue, allowNegative]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    let normalizedValue = normalizeDecimalInput(localValue);

    if (isMathExpression(localValue)) {
      const result = evaluateMathExpression(localValue, getDecimalSeparator());
      const minResult = min ? Number(min) : undefined;
      const maxResult = max ? Number(max) : undefined;
      if (result === null || !validateNumber(String(result), minResult, maxResult, allowNegative).isValid) {
        // Keep the text as typed so it can be fixed; the form keeps its previous value.
        setEntryError(t("form.expression.invalid"));
        return;
      }
      normalizedValue = String(result);
      setLocalValue(formatDisplayValue(result));
    }

    if (normalizedValue === "" || normalizedValue === "-") {
      setValue(fieldName, null, { shouldValidate: true });
      return;
    }
    const minValue = min ? Number(min) : undefined;
    const maxValue = max ? Number(max) : undefined;

    const { isValid } = validateNumber(normalizedValue, minValue, maxValue, allowNegative);

    if (isValid) {
      setValue(fieldName, Number(normalizedValue), { shouldValidate: true });
    }
  }, [
    localValue,
    normalizeDecimalInput,
    getDecimalSeparator,
    formatDisplayValue,
    fieldName,
    setValue,
    min,
    max,
    allowNegative,
    t,
  ]);

  return (
    <TextInput
      field={field}
      readOnly={isReadOnly}
      value={displayValue}
      setValue={handleSetValue}
      errorText={entryError}
      onChange={(e) => handleSetValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-testid={`TextInput__${field.id}`}
    />
  );
};

export default QuantitySelector;

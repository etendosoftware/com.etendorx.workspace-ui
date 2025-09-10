import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext } from "react-hook-form";
import { useCallback, useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language";
import { validateNumber } from "@workspaceui/componentlibrary/src/utils/quantitySelectorUtil";

interface QuantitySelectorProps {
  field: Field;
  min?: number | string;
  max?: number | string;
}

export const QuantitySelector = ({ field, min, max }: QuantitySelectorProps) => {
  const { watch, setValue } = useFormContext();
  const { language } = useLanguage();
  const fieldName = field.hqlName;
  const formValue = watch(fieldName);
  const [localValue, setLocalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const getDecimalSeparator = useCallback(() => {
    return language === "es_ES" ? "," : ".";
  }, [language]);

  const normalizeDecimalInput = useCallback((value: string): string => {
    return value.replace(",", ".");
  }, []);

  const formatDisplayValue = useCallback((value: number): string => {
    const separator = getDecimalSeparator();
    return String(value).replace(".", separator);
  }, [getDecimalSeparator]);
  
  const displayValue = isFocused 
    ? localValue 
    : (formValue !== null && formValue !== undefined 
        ? formatDisplayValue(Number(formValue))
        : "");

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(displayValue);
    }
  }, [formValue, isFocused, displayValue]);

  const isValidIntermediateValue = useCallback((value: string): boolean => {
    // Allow empty, negative sign, numbers, and decimal separators
    return /^-?(\d+[.,]?\d*|[.,]?\d*)?$/.test(value);
  }, []);

  const handleSetValue = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^\d.,-]/g, "");
      
      // Update local value immediately for display
      setLocalValue(sanitized);
      
      // Only validate and update form when value is complete or empty
      if (sanitized === "") {
        setValue(fieldName, null, { shouldValidate: true });
        return;
      }
      
      // Allow intermediate values while typing
      if (!isValidIntermediateValue(sanitized)) {
        return;
      }
      
      // For complete values, validate and update
      const normalizedValue = normalizeDecimalInput(sanitized);
      
      // Skip validation for obviously incomplete values
      if (normalizedValue.endsWith('.') || normalizedValue === '' || normalizedValue === '-') {
        return;
      }
      
      const { isValid } = validateNumber(normalizedValue, min ? Number(min) : undefined, max ? Number(max) : undefined);
      
      if (isValid) {
        setValue(fieldName, Number(normalizedValue), { shouldValidate: true });
      }
    },
    [fieldName, min, max, setValue, normalizeDecimalInput, isValidIntermediateValue]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Validate and finalize the value on blur
    const normalizedValue = normalizeDecimalInput(localValue);
    
    if (normalizedValue === "" || normalizedValue === "-") {
      setValue(fieldName, null, { shouldValidate: true });
      return;
    }
    
    const { isValid } = validateNumber(normalizedValue, min ? Number(min) : undefined, max ? Number(max) : undefined);
    
    if (isValid) {
      setValue(fieldName, Number(normalizedValue), { shouldValidate: true });
    }
  }, [localValue, normalizeDecimalInput, fieldName, setValue, min, max]);

  return (
    <TextInput
      field={field}
      value={displayValue}
      setValue={handleSetValue}
      onChange={(e) => handleSetValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-testid={`TextInput__${field.id}`}
    />
  );
};

export default QuantitySelector;

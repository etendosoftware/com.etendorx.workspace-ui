import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext } from "react-hook-form";
import { useCallback } from "react";
import { validateNumber } from "@workspaceui/componentlibrary/src/utils/quantitySelectorUtil";

interface QuantitySelectorProps {
  field: Field;
  min?: number | string;
  max?: number | string;
}

export const QuantitySelector = ({ field, min, max }: QuantitySelectorProps) => {
  const { watch, setValue } = useFormContext();
  const fieldName = field.hqlName;
  const currentValue = watch(fieldName) ?? "";

  const handleSetValue = useCallback(
    (value: string) => {
      const sanitized = value.replace(/[^\d.]/g, "");
      if (sanitized === "") {
        setValue(fieldName, null, { shouldValidate: true });
        return;
      }
      const { isValid } = validateNumber(sanitized, min ? Number(min) : undefined, max ? Number(max) : undefined);
      if (isValid) {
        setValue(fieldName, Number(sanitized), { shouldValidate: true });
      }
    },
    [fieldName, min, max, setValue]
  );

  return (
    <TextInput
      field={field}
      value={currentValue}
      setValue={handleSetValue}
      onChange={(e) => handleSetValue(e.target.value)}
    />
  );
};

export default QuantitySelector;

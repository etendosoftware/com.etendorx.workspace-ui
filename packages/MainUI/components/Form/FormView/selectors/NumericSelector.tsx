import type { Field } from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { TextInput } from "./components/TextInput";

export const NumericSelector = ({ field, ...props }: { field: Field } & React.ComponentProps<typeof TextInput>) => {
  const { register, setValue, watch, getValues } = useFormContext();
  const currentValue = watch(field.hqlName);

  const convertToNumber = useCallback(
    (value: string) => {
      if (value === "" || value === null || value === undefined) {
        return field.isMandatory ? 0 : null;
      }

      if (typeof value === "number") {
        return value;
      }

      const stringValue = String(value);
      if (stringValue === "" || stringValue === "-" || stringValue === ".") {
        return field.isMandatory ? 0 : null;
      }

      const numericValue =
        field.column.reference === "11" ? Number.parseInt(stringValue, 10) : Number.parseFloat(stringValue);

      const result = Number.isNaN(numericValue) ? (field.isMandatory ? 0 : null) : numericValue;
      return result;
    },
    [field.column.reference, field.isMandatory],
  );

  const registration = register(field.hqlName, {
    setValueAs: (value) => {
      const converted = convertToNumber(value);
      return converted;
    },
  });

  const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      let value = event.target.value;

      value = value.replace(/[^\d.-]/g, "");
      value = value.replace(/(?!^)-/g, "");

      const parts = value.split(".");
      if (parts.length > 2) {
        value = `${parts.shift()}.${parts.join("")}`;
      }

      const numericValue = convertToNumber(value);
      setValue(field.hqlName, numericValue, { shouldValidate: true });
    },
    [field.hqlName, convertToNumber, setValue, getValues],
  );

  return (
    <TextInput
      {...props}
      {...registration}
      inputMode="decimal"
      pattern="^-?\d*(\.\d+)?$"
      field={field}
      onChange={handleChange}
    />
  );
};

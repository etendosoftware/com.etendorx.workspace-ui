import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { type Field, FieldType } from "@workspaceui/api-client/src/api/types";
import { formatNumber, getFieldReference } from "@/utils";

/**
 * Hook to safely get field value with proper identifier/value synchronization
 */
export const useFieldValue = (field: Field) => {
  const { watch } = useFormContext();
  const [value, identifier] = watch([field.hqlName, `${field.hqlName}$_identifier`]);

  const displayValue = useMemo(() => {
    if (identifier !== null && identifier !== undefined && identifier !== "") {
      return identifier;
    }

    if (value === null || value === undefined || value === "") {
      return "";
    }

    const reference = getFieldReference(field.column?.reference);

    switch (reference) {
      case FieldType.DATE:
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      case FieldType.BOOLEAN:
        return value ? "Y" : "N";
      case FieldType.NUMBER:
      case FieldType.QUANTITY:
        return formatNumber(value);
      default:
        return String(value);
    }
  }, [field, identifier, value]);

  return {
    value,
    identifier,
    displayValue,
    hasIdentifier: identifier !== null && identifier !== undefined && identifier !== "",
    isEmpty:
      (value === null || value === undefined || value === "") &&
      (identifier === null || identifier === undefined || identifier === ""),
  };
};

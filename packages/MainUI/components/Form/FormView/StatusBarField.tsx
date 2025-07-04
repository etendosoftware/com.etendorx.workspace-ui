import { formatNumber, getFieldReference } from "@/utils";
import { type Field, FieldType } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

export default function StatusBarField({ field }: { field: Field }) {
  const { register, watch } = useFormContext();
  const [value, identifier] = watch([field.hqlName, `${field.hqlName}$_identifier`]);
  const displayValue = useMemo(() => {
    if (identifier) {
      return identifier;
    }

    const reference = getFieldReference(field.column?.reference);

    switch (reference) {
      case FieldType.DATE:
        return new Date(value).toLocaleDateString();
      case FieldType.BOOLEAN:
        return value ? "Y" : "N";
      case FieldType.NUMBER:
      case FieldType.QUANTITY:
        return formatNumber(value);
      default:
        return value;
    }
  }, [field, identifier, value]);

  return (
    <div className="inline-flex gap-1">
      <label htmlFor={field.hqlName} className="font-semibold">
        {field.name}:
      </label>
      <span className="" {...register(field.hqlName)}>
        {displayValue}
      </span>
    </div>
  );
}

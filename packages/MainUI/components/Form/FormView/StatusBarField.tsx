import type { Field } from "@workspaceui/api-client/src/api/types";
import { useFormContext } from "react-hook-form";
import { useFieldValue } from "@/hooks/useFieldValue";

export default function StatusBarField({ field }: { field: Field }) {
  const { register } = useFormContext();
  const { displayValue } = useFieldValue(field);

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

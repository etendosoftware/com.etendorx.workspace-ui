import type { Field } from "@workspaceui/api-client/src/api/types";
import { useFormContext } from "react-hook-form";

function formatDateForInput(value: string) {
  const date = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const DatetimeSelector = ({ field, isReadOnly }: { field: Field; isReadOnly?: boolean }) => {
  const { register, getValues } = useFormContext();
  const value = getValues(field.hqlName);

  return (
    <input type="datetime-local" {...register(field.hqlName)} readOnly={isReadOnly} value={formatDateForInput(value)} />
  );
};

export default DatetimeSelector;

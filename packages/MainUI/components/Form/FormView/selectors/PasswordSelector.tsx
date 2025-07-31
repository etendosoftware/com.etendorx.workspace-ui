import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext } from "react-hook-form";

export const PasswordSelector = (props: { field: Field } & React.ComponentProps<typeof TextInput>) => {
  const { register } = useFormContext();

  return (
    <TextInput
      {...props}
      {...register(props.field.hqlName)}
      type="password"
      maxLength={Number(props.field.column.length)}
      autoComplete="new-password"
    />
  );
};

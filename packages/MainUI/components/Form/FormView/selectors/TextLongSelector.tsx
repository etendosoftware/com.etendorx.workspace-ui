/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextAreaInput } from "./components/TextAreaInput";
import { useFormContext, type FieldValues } from "react-hook-form";

export const TextLongSelector = (props: { field: Field } & React.ComponentProps<typeof TextAreaInput>) => {
  const { register, watch, setValue } = useFormContext<FieldValues>();
  const fieldName = props.field.hqlName;

  const currentValue = watch(fieldName);
  const handleSetValue = (value: string) => {
    setValue(fieldName, value, { shouldValidate: true });
  };
  return (
    <TextAreaInput
      {...register(fieldName)}
      field={props.field}
      setValue={handleSetValue}
      showClearButton={true}
      value={currentValue}
      rows={2}
      data-testid="TextAreaInput__1e890e"
    />
  );
};

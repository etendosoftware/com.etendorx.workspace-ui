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
 * All portions are Copyright (C) 2021-2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext, type FieldValues } from "react-hook-form";

interface LinkSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

export const LinkSelector = ({ field, isReadOnly }: LinkSelectorProps) => {
  const { register, watch, setValue } = useFormContext<FieldValues>();
  const fieldName = field.hqlName;
  const currentValue = watch(fieldName) as string | undefined;

  if (isReadOnly) {
    if (!currentValue) {
      return <span className="text-sm text-gray-400 h-10.5 flex items-center px-3">&mdash;</span>;
    }

    return (
      <a
        href={currentValue}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 underline hover:text-blue-800 truncate block h-10.5 flex items-center px-3 max-w-full"
        title={currentValue}>
        {currentValue}
      </a>
    );
  }

  const handleSetValue = (value: string) => {
    setValue(fieldName, value, { shouldValidate: true });
  };

  return (
    <TextInput
      {...register(fieldName)}
      field={field}
      setValue={handleSetValue}
      showClearButton={true}
      value={currentValue}
      placeholder="https://..."
      data-testid={`LinkSelector__${field.id}`}
    />
  );
};

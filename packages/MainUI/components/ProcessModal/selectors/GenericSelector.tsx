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

import { getFieldReference } from "@/utils";
import { FieldType, type ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { useFormContext } from "react-hook-form";
import RadioSelector from "./RadioSelector";

const GenericSelector = ({ parameter, readOnly }: { parameter: ProcessParameter; readOnly?: boolean }) => {
  const { register } = useFormContext();
  const reference = getFieldReference(parameter.reference);

  if (reference === FieldType.LIST) {
    return <RadioSelector parameter={parameter} />;
    // return <ListSelector parameter={parameter} />;
  }
  return (
    <input
      readOnly={readOnly}
      className={`w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-(--color-etendo-main) ${readOnly ? "bg-(--color-baseline-10) font-medium text-zinc-500" : ""}`}
      {...register(parameter.dBColumnName, {
        required: parameter.required,
        disabled: readOnly,
      })}
    />
  );
};

export default GenericSelector;

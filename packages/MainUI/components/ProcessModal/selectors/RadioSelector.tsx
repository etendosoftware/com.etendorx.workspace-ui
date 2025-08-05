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

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { RadioGrid } from "@workspaceui/componentlibrary/src/components";
import type { RadioGridOption } from "@workspaceui/componentlibrary/src/components/RadioGrid";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const RadioSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  const { register, setValue, watch } = useFormContext();
  const selectedOption = watch(parameter.dBColumnName);

  useEffect(() => {
    if (parameter.defaultValue && !selectedOption) {
      setValue(parameter.dBColumnName, parameter.defaultValue);
    }
  }, [parameter, selectedOption, setValue]);

  const handleSelect = (value: string) => {
    setValue(parameter.dBColumnName, value);
  };

  const radioOptions: RadioGridOption[] = parameter.refList.map((option) => ({
    value: option.value,
    label: option.label,
    description: option.value !== option.label ? option.value : undefined,
  }));

  return (
    <div>
      <RadioGrid
        options={radioOptions}
        selectedValue={selectedOption || null}
        onSelect={handleSelect}
        columns={parameter.refList.length <= 2 ? (parameter.refList.length as 1 | 2) : 3}
        name={parameter.dBColumnName}
        className="grid-flow-col"
      />
      <input
        type="hidden"
        {...register(parameter.dBColumnName, {
          required: parameter.required,
        })}
      />
    </div>
  );
};

export default RadioSelector;

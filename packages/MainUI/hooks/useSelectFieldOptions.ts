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

import type { SelectProps } from "@/components/Form/FormView/selectors/components/types";
import type { EntityData, Field } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

export const useSelectFieldOptions = (field: Field, records: EntityData[]) => {
  const { watch } = useFormContext();
  const idKey = (field.selector?.valueField ?? "") as string;
  const identifierKey = (field.selector?.displayField ?? "") as string;
  const [currentValue, currentIdentifier] = watch([field.hqlName, `${field.hqlName}$_identifier`]);

  return useMemo(() => {
    const result: SelectProps["options"] = [];

    for (const record of records) {
      const label = record[identifierKey] as string;
      const id = record[idKey] as string;

      if (id && label) {
        result.push({ id, label, data: record });
      }
    }

    const currentOption = result.find((record) => record.id === currentValue);

    if (!currentOption && currentValue && currentIdentifier) {
      result.push({ id: currentValue, label: currentIdentifier, data: {} });
    }

    return result;
  }, [currentIdentifier, currentValue, idKey, identifierKey, records]);
};

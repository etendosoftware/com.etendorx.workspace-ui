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

const buildOptionsFromInjected = (injectedEntries: any[]): SelectProps["options"] => {
  const result: SelectProps["options"] = [];
  for (const { id, label } of injectedEntries) {
    if (id && label) {
      result.push({ id, label, data: {} });
    }
  }
  return result;
};

const buildOptionsFromRecords = (records: EntityData[], idKey: string, identifierKey: string): SelectProps["options"] => {
  const result: SelectProps["options"] = [];
  for (const record of records) {
    const label = record[identifierKey] as string;
    const id = record[idKey] as string;
    if (id && label) {
      result.push({ id, label, data: record });
    }
  }
  return result;
};

const addCurrentValueIfMissing = (options: SelectProps["options"], currentValue: string, currentIdentifier: string): SelectProps["options"] => {
  const currentOption = options.find((record) => record.id === currentValue);
  if (!currentOption && currentValue && currentIdentifier) {
    return [...options, { id: currentValue, label: currentIdentifier, data: {} }];
  }
  return options;
};

export const useSelectFieldOptions = (field: Field, records: EntityData[]) => {
  const { watch } = useFormContext();
  const idKey = (field.selector?.valueField ?? "") as string;
  const identifierKey = (field.selector?.displayField ?? "") as string;
  const [currentValue, currentIdentifier, injectedEntries] = watch([
    field.hqlName,
    `${field.hqlName}$_identifier`,
    `${field.hqlName}$_entries`,
  ]);

  return useMemo(() => {
    const injected = Array.isArray(injectedEntries) ? injectedEntries : [];
    
    let result: SelectProps["options"];
    if (injected.length > 0) {
      result = buildOptionsFromInjected(injected);
    } else {
      result = buildOptionsFromRecords(records, idKey, identifierKey);
    }

    return addCurrentValueIfMissing(result, currentValue, currentIdentifier);
  }, [currentIdentifier, currentValue, idKey, identifierKey, records, injectedEntries]);
};

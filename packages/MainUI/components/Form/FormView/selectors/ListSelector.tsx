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

import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { filterActiveListOptions, restrictListOptionsToEntries, type ListEntry } from "@/utils/form/listOptions";
import Select from "./components/Select/Select";
import type { SelectProps } from "./components/types";

export const ListSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  // `entries` are the values the server allows for the field (validation rule applied), refreshed by callouts.
  const [currentValue, entries] = useWatch({ name: [field.hqlName, `${field.hqlName}$_entries`] }) as [
    unknown,
    ListEntry[] | undefined,
  ];

  const options = useMemo<SelectProps["options"]>(() => {
    if (field.refList) {
      const active = filterActiveListOptions(Array.from(field.refList), currentValue);
      return restrictListOptionsToEntries(active, entries, currentValue).map((item) => ({
        id: item.value,
        label: item.label,
      }));
    }

    return [];
  }, [field.refList, currentValue, entries]);

  return (
    <Select name={field.hqlName} options={options} isReadOnly={isReadOnly} field={field} data-testid="Select__2483fb" />
  );
};

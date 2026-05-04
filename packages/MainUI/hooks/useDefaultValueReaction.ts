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

import { useMemo, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { getFieldsByColumnName } from "@workspaceui/api-client/src/utils/metadata";

interface Params {
  tab: Tab;
  formMethods: UseFormReturn<EntityData>;
  isFormInitializing: boolean;
}

/**
 * Reactively applies @ColumnName@ defaultValue references.
 * When a source field's value changes after form initialization, any non-dirty
 * field whose column.defaultValue = "@SourceCol@" is updated to match.
 * Skips updates while the form is initializing (same guard as callouts).
 */
export function useDefaultValueReaction({ tab, formMethods, isFormInitializing }: Params) {
  const { watch, setValue, formState } = formMethods;
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);

  const dependencyMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const field of Object.values(tab.fields)) {
      const dv = field?.column?.defaultValue;
      if (!dv || !field.hqlName) continue;
      const match = /^@(\w+)@$/.exec(dv);
      if (!match) continue;
      const src = fieldsByColumnName[match[1]];
      if (!src?.hqlName) continue;
      const deps = map.get(src.hqlName) ?? [];
      deps.push(field.hqlName);
      map.set(src.hqlName, deps);
    }
    return map;
  }, [tab.fields, fieldsByColumnName]);

  const dirtyRef = useRef(formState.dirtyFields);
  dirtyRef.current = formState.dirtyFields;

  const isInitializingRef = useRef(isFormInitializing);
  isInitializingRef.current = isFormInitializing;

  useEffect(() => {
    if (dependencyMap.size === 0) return;

    const subscription = watch((values, { name: changedField }) => {
      if (!changedField || isInitializingRef.current) return;
      const dependents = dependencyMap.get(changedField);
      if (!dependents?.length) return;

      const newValue = (values as Record<string, unknown>)[changedField];
      if (newValue === undefined || newValue === "") return;

      for (const depHqlName of dependents) {
        if (dirtyRef.current[depHqlName as keyof typeof dirtyRef.current]) continue;
        setValue(depHqlName, newValue as EntityData[keyof EntityData], {
          shouldDirty: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue, dependencyMap]);
}

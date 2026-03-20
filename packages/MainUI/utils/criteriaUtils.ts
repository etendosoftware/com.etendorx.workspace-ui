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

import type { Tab, EntityValue } from "@workspaceui/api-client/src/api/types";

export interface BaseCriteriaOptions {
  tab: Tab;
  parentTab?: Tab | null;
  parentId?: string | number;
}

export interface CriteriaItem {
  fieldName: string;
  operator: string;
  value: EntityValue;
}

/**
 * Resolves the field name in `tab` that references `parentTab`.
 * Shared by `buildBaseCriteria` and `useTableData`'s parent field resolution.
 *
 * Resolution order:
 *  1. parentColumns whose field directly references the parent entity (referencedEntity / targetEntity)
 *  2. parentColumns whose name contains the parent entity name (substring match)
 *  3. Any field in tab.fields whose name exactly matches the parent entity name
 *  4. First entry in parentColumns, or "id" as final fallback
 */
export const resolveParentFieldName = (tab: Tab, parentTab: Tab): string => {
  if (!tab.parentColumns || tab.parentColumns.length === 0) {
    return "id";
  }

  let matchingFields = tab.parentColumns.filter((colName) => {
    const field = tab.fields?.[colName];
    return field?.referencedEntity === parentTab.entityName || field?.targetEntity === parentTab.entityName;
  });

  // Fallback: if no field matches by referenced entity, try matching by name
  if (matchingFields.length === 0) {
    matchingFields = tab.parentColumns.filter((colName) =>
      colName.toLowerCase().includes(parentTab.entityName.toLowerCase())
    );
  }

  // If multiple fields remain, prioritize the one whose name exactly matches the entity
  const matchingField =
    matchingFields.length > 1
      ? matchingFields.find((f) => f.toLowerCase() === parentTab.entityName.toLowerCase()) ||
        matchingFields.find((f) => f.toLowerCase().includes(parentTab.entityName.toLowerCase())) ||
        matchingFields[0]
      : matchingFields[0];

  // Final fallback: if no field was found in parentColumns, try to find any field in the tab
  // whose name matches the parent entity name (common in Rx/Classic property mapping)
  if (!matchingField) {
    const entityMatch = Object.keys(tab.fields || {}).find(
      (f) => f.toLowerCase() === parentTab.entityName.toLowerCase()
    );
    if (entityMatch) {
      return entityMatch;
    }
  }

  return matchingField || tab.parentColumns[0] || "id";
};

/**
 * Builds the base criteria for a datasource request.
 * Handles the logic for Parent-Child relationships.
 *
 * When a `parentId` is present (i.e. the user has selected a record in the parent tab),
 * this mirrors Etendo Classic behavior by returning a `_dummy` criteria. Classic always
 * sends `_dummy` for parent-child tab navigation, never an explicit field criteria.
 * The actual filtering is done server-side via session variables (e.g. `@EntityName.id@`)
 * set separately in `useTableData`.
 *
 * The `resolveParentFieldName` logic is used as a fallback for cases where
 * `parentId` is not set but a tab/parentColumns relationship is defined.
 */
export const buildBaseCriteria = ({ tab, parentTab, parentId }: BaseCriteriaOptions): [] | [CriteriaItem] => {
  if (!parentTab) {
    return [];
  }

  // Classic sends _dummy for parent-child tab navigation when disableParentKeyProperty is true.
  // The server uses @EntityName.id@ session variables (set in useTableData) for the actual filtering.
  if (tab.disableParentKeyProperty && parentId && parentId !== "") {
    return [{ fieldName: "_dummy", value: Date.now() as EntityValue, operator: "equals" }];
  }

  const fieldName = resolveParentFieldName(tab, parentTab);

  if (parentId && parentId !== "") {
    return [{ fieldName, value: parentId as EntityValue, operator: "equals" }];
  }

  return [];
};

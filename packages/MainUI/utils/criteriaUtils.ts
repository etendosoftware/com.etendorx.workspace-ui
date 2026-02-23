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
 * Builds the base criteria for a datasource request.
 * Handles the logic for Parent-Child relationships.
 */
export const buildBaseCriteria = ({ tab, parentTab, parentId }: BaseCriteriaOptions): [] | [CriteriaItem] => {
  if (!parentTab) {
    return [];
  }

  const getParentFieldName = () => {
    if (tab.fields && tab.parentColumns && tab.parentColumns.length > 0) {
      return tab.parentColumns[0] || "id";
    }

    const matchingField =
      tab.fields && tab.parentColumns
        ? tab.parentColumns.find((colName) => {
            const field = tab.fields[colName];
            return field?.referencedEntity === parentTab.entityName;
          })
        : undefined;

    return matchingField || tab.parentColumns?.[0] || "id";
  };

  const fieldName = getParentFieldName();
  const operator = "equals";

  if (parentId && parentId !== "") {
    return [{ fieldName, value: parentId as EntityValue, operator }];
  }

  return [];
};

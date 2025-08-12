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

import type { TranslateFunction } from "@/hooks/types";
import { getFieldReference } from "@/utils";
import Tag from "@workspaceui/componentlibrary/src/components/Tag";
import { type Column, type Field, FieldType } from "@workspaceui/api-client/src/api/types";
import { DEFAULT_STATUS_CONFIG, IDENTIFIER_KEY, statusConfig, yesNoConfig } from "./columnsConstants";

export const parseColumns = (columns?: Field[], t?: TranslateFunction): Column[] => {
  const result: Column[] = [];

  try {
    if (!columns) return result;

    for (const column of columns) {
      if (column.showInGridView) {
        let columnType = "";

        if (column.column?.reference$_identifier) {
          columnType = column.column.reference$_identifier;
        }

        result.push({
          header: column.name ?? column.hqlName,
          id: column.name,
          columnName: column.hqlName,
          isMandatory: column.isMandatory,
          _identifier: column.name,
          column: {
            _identifier: columnType,
            reference: column.column?.reference,
          },
          name: column.name,
          type: columnType,
          referencedWindowId: column.referencedWindowId,
          accessorFn: (v: Record<string, unknown>) => {
            const reference = getFieldReference(column.column?.reference);

            if (reference === FieldType.BOOLEAN) {
              const yesText = t ? t("common.trueText") : "Yes";
              const noText = t ? t("common.falseText") : "No";

              const config = v[column.hqlName] ? yesNoConfig.Y : yesNoConfig.N;

              return <Tag type={config.type} icon={config.icon} label={v[column.hqlName] ? yesText : noText} />;
            }

            if (reference === FieldType.LIST && column.refList && Array.isArray(column.refList)) {
              const codeValue = v[column.hqlName];

              if (codeValue === null || codeValue === undefined) {
                return v[`${column.hqlName}$${IDENTIFIER_KEY}`] ?? "";
              }

              const refItem = column.refList.find((item) => item.value === codeValue);

              if (refItem) {
                const config = statusConfig[refItem.value as string] || DEFAULT_STATUS_CONFIG;

                return <Tag type={config.type} icon={config.icon} label={refItem.label} />;
              }
            }
            const columnHqlName = column.hqlName;
            const columnNameKey = column.columnName;
            const columnIdentifier = `${columnHqlName}$${IDENTIFIER_KEY}`;
            const columnHqlIdentifierValue = v[columnIdentifier];
            const columnHqlNameValue = v[columnHqlName];
            const columnNameValue = v[columnNameKey];

            const value = columnHqlIdentifierValue ?? columnHqlNameValue ?? columnNameValue;
            return value;
          },
        });
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return result;
};

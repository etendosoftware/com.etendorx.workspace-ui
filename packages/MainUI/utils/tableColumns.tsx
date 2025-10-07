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

// Utility function to format audit date fields only
const formatAuditDateField = (value: unknown): string => {
  if (!value || typeof value !== "string") return String(value || "");

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    // Format as DD-MM-YYYY HH:mm:ss
    const dateStr = new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .format(date)
      .replace(/\//g, "-");

    const timeStr = new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);

    return `${dateStr} ${timeStr}`;
  } catch {
    return String(value);
  }
};

// Helper function to handle boolean field rendering
const renderBooleanField = (value: Record<string, unknown>, column: Field, t?: TranslateFunction) => {
  const yesText = t ? t("common.trueText") : "Yes";
  const noText = t ? t("common.falseText") : "No";
  const config = value[column.hqlName] ? yesNoConfig.Y : yesNoConfig.N;

  return (
    <Tag
      type={config.type}
      icon={config.icon}
      label={value[column.hqlName] ? yesText : noText}
      data-testid="Tag__2b5175"
    />
  );
};

// Helper function to handle list field rendering
const renderListField = (value: Record<string, unknown>, column: Field) => {
  const codeValue = value[column.hqlName];

  if (codeValue === null || codeValue === undefined) {
    return value[`${column.hqlName}$${IDENTIFIER_KEY}`] ?? "";
  }

  const refItem = column.refList?.find((item) => item.value === codeValue);
  if (refItem) {
    const config = statusConfig[refItem.value as string] || DEFAULT_STATUS_CONFIG;
    return <Tag type={config.type} icon={config.icon} label={refItem.label} data-testid="Tag__2b5175" />;
  }

  return "";
};

// Helper function to get raw cell value
const getRawCellValue = (value: Record<string, unknown>, column: Field) => {
  const columnHqlName = column.hqlName;
  const columnNameKey = column.columnName;
  const columnIdentifier = `${columnHqlName}$${IDENTIFIER_KEY}`;
  const columnHqlIdentifierValue = value[columnIdentifier];
  const columnHqlNameValue = value[columnHqlName];
  const columnNameValue = value[columnNameKey];

  return columnHqlIdentifierValue ?? columnHqlNameValue ?? columnNameValue;
};

export const parseColumns = (columns?: Field[], t?: TranslateFunction): Column[] => {
  const result: Column[] = [];

  try {
    if (!columns) return result;

    for (const column of columns) {
      let columnType = "";

      if (column.column?.reference$_identifier) {
        columnType = column.column.reference$_identifier;
      }

      // Get the proper field type using the reference mapping
      const fieldType = getFieldReference(column.column?.reference);

      result.push({
        header: column.name ?? column.hqlName,
        id: column.name,
        fieldId: column.id,
        columnName: column.hqlName,
        isMandatory: column.isMandatory,
        _identifier: column.name,
        column: {
          _identifier: columnType,
          reference: column.column?.reference,
        },
        shownInStatusBar: column.shownInStatusBar,
        showInGridView: column.showInGridView,
        enableHiding: true, // Allow all columns to be hidden/shown from menu
        displayed: column.displayed,
        name: column.name,
        type: fieldType, // Use the properly mapped field type
        referencedWindowId: column.referencedWindowId,
        refList: column.refList, // Include refList for SELECT fields
        referencedEntity: column.referencedEntity, // Include referencedEntity for TABLEDIR fields
        // Include selector information for TABLEDIR filters
        selectorDefinitionId: column.selector?.id,
        datasourceId: column.targetEntity || column.referencedEntity, // Use targetEntity if available
        accessorFn: (v: Record<string, unknown>) => {
          const reference = getFieldReference(column.column?.reference);

          if (reference === FieldType.BOOLEAN) {
            return renderBooleanField(v, column, t);
          }

          if (reference === FieldType.LIST && column.refList && Array.isArray(column.refList)) {
            return renderListField(v, column);
          }

          const rawValue = getRawCellValue(v, column);

          // Only format audit date fields specifically
          if (column.hqlName === "creationDate" || column.hqlName === "updated") {
            return formatAuditDateField(rawValue);
          }

          return rawValue;
        },
      });
    }
  } catch (e) {
    console.warn(e);
  }

  return result;
};

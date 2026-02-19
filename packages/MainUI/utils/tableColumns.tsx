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
import { isColorString, getContrastTextColor } from "@/utils/color/utils";

// Helper function to handle boolean field rendering
const renderBooleanField = (value: Record<string, unknown>, column: Field, t?: TranslateFunction) => {
  const yesText = t ? t("common.trueText") : "Yes";
  const noText = t ? t("common.falseText") : "No";
  const config = value[column.hqlName] ? yesNoConfig.Y : yesNoConfig.N;

  return <Tag icon={config.icon} label={value[column.hqlName] ? yesText : noText} data-testid="Tag__2b5175" />;
};

// Helper function to process and validate tag colors
const processTagColors = (color?: string) => {
  if (!color) {
    return { tagColor: undefined, textColor: undefined };
  }

  const normalizedColor = color.trim().toLowerCase();
  const isValidColor = isColorString(normalizedColor);

  if (!isValidColor) {
    return { tagColor: undefined, textColor: undefined };
  }

  return {
    tagColor: normalizedColor,
    textColor: getContrastTextColor(normalizedColor),
  };
};

// Helper function to handle list field rendering
const renderListField = (value: Record<string, unknown>, column: Field) => {
  const codeValue = value[column.hqlName];

  if (codeValue === null || codeValue === undefined) {
    return value[`${column.hqlName}$${IDENTIFIER_KEY}`] ?? "";
  }

  const refItem = column.refList?.find((item) => item.value === codeValue);
  if (!refItem) {
    return "";
  }

  const { value: itemValue, label, color } = refItem;
  const config = statusConfig[itemValue] || DEFAULT_STATUS_CONFIG;
  const { tagColor, textColor } = processTagColors(color);

  return <Tag icon={config.icon} label={label} tagColor={tagColor} textColor={textColor} data-testid="Tag__2b5175" />;
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

      // Get the proper field type using the corrected reference mapping
      const fieldType = getFieldReference(column.column?.reference);

      // Field type mapping now uses corrected reference codes

      // Field type mapping now uses corrected reference codes

      result.push({
        header: column.name ?? column.hqlName,
        id: column.name,
        fieldId: column.id,
        columnName: column.hqlName,
        isMandatory: column.isMandatory,
        _identifier: column.name,
        column: {
          _identifier: columnType || "",
          reference: column.column?.reference,
          ...(column.readOnlyLogicExpression ? { readOnlyLogicExpression: column.readOnlyLogicExpression } : {}), // Include for inline editing
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
        customJs: column.etmetaCustomjs,
        referencedTabId: column.referencedTabId,
        // Include additional field properties needed for inline editing
        isReadOnly: column.isReadOnly,
        isUpdatable: column.isUpdatable,
        readOnlyLogicExpression: column.readOnlyLogicExpression,
        isReferencedWindowAccessible: column.isReferencedWindowAccessible,
        isAuditField: column.isAuditField,
        accessorFn: (v: Record<string, unknown>) => {
          const reference = getFieldReference(column.column?.reference);

          if (reference === FieldType.BOOLEAN) {
            return renderBooleanField(v, column, t);
          }

          if (reference === FieldType.LIST && column.refList && Array.isArray(column.refList)) {
            return renderListField(v, column);
          }

          const rawValue = getRawCellValue(v, column);

          // Don't format audit date fields here - let useColumns handle display formatting
          // This preserves the original datetime value for correct sorting
          return rawValue;
        },
      });
    }
  } catch (e) {
    console.warn(e);
  }

  return result;
};

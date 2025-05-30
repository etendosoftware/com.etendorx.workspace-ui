import type { TranslateFunction } from "@/hooks/types";
import { getFieldReference } from "@/utils";
import Tag from "@workspaceui/componentlibrary/src/components/Tag";
import { type Column, type Field, FieldType } from "@workspaceui/etendohookbinder/src/api/types";
import { DEFAULT_STATUS_CONFIG, statusConfig, yesNoConfig } from "./columnsConstants";

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
          },
          name: column.name,
          type: columnType,
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
                return v[`${column.hqlName}$_identifier`] ?? "";
              }

              const refItem = column.refList.find((item) => item.value === codeValue);

              if (refItem) {
                const config = statusConfig[refItem.value as string] || DEFAULT_STATUS_CONFIG;

                return <Tag type={config.type} icon={config.icon} label={refItem.label} />;
              }
            }

            return v[`${column.hqlName}$_identifier`] ?? v[column.hqlName];
          },
        });
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return result;
};

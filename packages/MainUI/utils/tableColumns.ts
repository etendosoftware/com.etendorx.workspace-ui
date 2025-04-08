import { FieldType, type Column, type Field } from '@workspaceui/etendohookbinder/src/api/types';
import { getFieldReference } from '@/utils';

export const parseColumns = (columns?: Field[]): Column[] => {
  const result: Column[] = [];

  try {
    if (!columns) return result;

    for (const column of columns) {
      if (column.showInGridView) {
        let columnType = '';

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
            const reference = getFieldReference(column);

            if (reference == FieldType.BOOLEAN) {
              return v[column.hqlName] ? 'Y' : 'N';
            }

            return v[column.hqlName + '$_identifier'] ?? v[column.hqlName];
          },
        });
      }
    }
  } catch (e) {
    console.warn(e);
  }

  return result;
};

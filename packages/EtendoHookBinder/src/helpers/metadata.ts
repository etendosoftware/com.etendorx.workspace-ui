import type { Etendo } from '../api/metadata';

export const parseColumns = (columns?: Etendo.Field[]): Etendo.Column[] => {
  const result: Etendo.Column[] = [];

  if (!columns) return result;

  for (const column of columns) {
    if (column.showInGridView) {
      result.push({
        header: column.title ?? column.name ?? column.columnName,
        id: column.name,
        columnName: column.columnName,
        isMandatory: column.required,
        _identifier: column.title,
        column: {
          _identifier: column.title,
          reference: column.type,
        },
        name: column.name,
        accessorFn: (v: Record<string, unknown>) => {
          return v[column.columnName + '$_identifier'] ?? v[column.columnName];
        },
      });
    }
  }

  return result;
};

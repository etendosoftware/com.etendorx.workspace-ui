import type { Etendo } from '../api/metadata';

export const parseColumns = (columns?: Etendo.Field[]): Etendo.Column[] => {
  if (!columns) {
    return [];
  }

  return columns.map(column => ({
    header: column.title ?? column.name ?? column.columnName,
    id: column.name,
    columnName: column.columnName,
    isMandatory: column.required,
    _identifier: column.title,
    column: {
      reference: column.type,
    },
    name: column.name,
    accessorFn: (v: Record<string, unknown>) => {
      return v[column.columnName + '$_identifier'] ?? v[column.columnName];
    },
  }));
};

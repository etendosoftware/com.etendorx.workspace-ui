import type { Etendo } from '../api/metadata';

export const parseColumns = (columns?: Etendo.Field[]): Etendo.Column[] => {
  if (!columns) {
    return [];
  }

  return columns.map(column => ({
    header: column.title ?? column.name ?? column.columnName,
    id: column.name,
    accessorFn: (v: Record<string, unknown>) => {
      const identifier = column.columnName + '$_identifier';

      return v[identifier] ?? v[column.columnName];
    },
  }));
};

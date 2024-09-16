import type { Etendo } from '../api/metadata';

export const parseColumns = (columns?: Etendo.Field[]): Etendo.Column[] => {
  return (columns ?? []) as unknown as Etendo.Column[];

  console.debug({ columns });
  if (!columns) {
    return [];
  }

  return columns
    .filter(column => {
      if (!column.gridProps) {
        return false;
      } else {
        return column.gridProps.showIf !== 'false';
      }
    })
    .sort((columnA, columnB) => {
      if (columnA.gridProps.sort < columnB.gridProps.sort) {
        return -1;
      } else {
        return 1;
      }
    })
    .map(column => ({
      header: column.title ?? column.name ?? column.columnName,
      id: column.name,
      accessorFn: (v: Record<string, unknown>) => {
        const identifier = column.name + '$_identifier';

        return typeof v[identifier] !== 'undefined'
          ? v[identifier]
          : v[column.name];
      },
    }));
};

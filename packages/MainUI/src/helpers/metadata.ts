export const parseColumns = (columns?: Etendo.Field[]) => {
  if (!columns) {
    return [];
  }

  return columns
    .filter(c => {
      if (!c.gridProps) {
        return false;
      } else {
        return c.gridProps.showIf !== 'false';
      }
    })
    .sort((a, b) => {
      if (a.gridProps.sort < b.gridProps.sort) {
        return -1;
      } else {
        return 1;
      }
    })
    .map(column => ({
      header: column.title ?? column.name ?? column.columnName,
      id: column.name,
      accessorFn: v => {
        const identifier = column.name + '$_identifier';

        return typeof v[identifier] !== 'undefined'
          ? v[identifier]
          : v[column.name];
      },
    }));
};

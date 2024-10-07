import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/api/metadata';

export const groupTabsByLevel = (windowData?: Etendo.WindowMetadata) => {
  if (!windowData?.tabs) {
    return [];
  }

  return [];

  const tabs: Etendo.Tab[][] = [];

  windowData?.tabs.forEach(tab => {
    if (tabs[tab.level]) {
      tabs[tab.level].push(tab);
    } else {
      tabs[tab.level] = [tab];
    }
  });

  return tabs;
};

export const buildColumnsData = (windowData?: Etendo.WindowMetadata) => {
  const cols: Record<number, Record<string, Etendo.Column[]>> = {};

  if (windowData?.tabs?.length) {
    windowData.tabs.forEach(tab => {
      if (!cols[tab.level]) {
        cols[tab.level] = {};
      }

      cols[tab.level][tab.id] = Metadata.getColumns(tab.id);
    });
  }

  return cols;
};

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

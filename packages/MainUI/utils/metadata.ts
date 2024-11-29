import { type Etendo, Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';

export const groupTabsByLevel = (windowData?: Etendo.WindowMetadata) => {
  if (!windowData?.tabs) {
    return [];
  }

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

export const getInputName = (field: Field) => `inp${field.inpName}`;

export const getFieldValue = (field: Field, record: Record<string, unknown>) => {
  const inpName = getInputName(field);

  if (inpName in record) {
    return record[inpName];
  } else {
    return record[field.fieldName];
  }
};

export const buildFormState = (fields: Tab['fields'], record: Record<string, unknown>) =>
  Object.values(fields).reduce((state, field) => {
    state[getInputName(field)] = getFieldValue(field, record);

    return state;
  }, {} as Record<string, unknown>);

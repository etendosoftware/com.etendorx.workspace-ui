import { type Etendo, Metadata } from '../api/metadata';
import { Field, FieldType, Tab } from '../api/types';

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

const inputNameCache: Record<string, string> = {};

export function getInputName(field: Field) {
  if (!inputNameCache[field.inpName]) {
    inputNameCache[field.inpName] = `inp${field.inpName}`;
  }

  return inputNameCache[field.inpName];
}

export const buildFormState = (fields: Tab['fields'], record: Record<string, unknown>) =>
  Object.entries(fields).reduce((state, [fieldName, field]) => {
    state[getInputName(field)] = record[fieldName];

    return state;
  }, {} as Record<string, unknown>);

export const isEntityReference = (type: FieldType) => ['tabledir', 'search'].includes(type);

export const getFieldsByDBColumnName = (tab: Tab) =>
  Object.entries(tab.fields).reduce((acc, [_, field]) => {
    acc[field.column.dBColumnName] = field;

    return acc;
  }, {} as Record<string, Field>);

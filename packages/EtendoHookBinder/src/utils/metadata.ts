import { type Etendo } from '../api/metadata';
import { Field, FieldType, Tab } from '../api/types';

export const groupTabsByLevel = (windowData?: Etendo.WindowMetadata) => {
  const tabs: Etendo.Tab[][] = [];

  try {
    if (!windowData?.tabs) {
      return tabs;
    }

    windowData?.tabs.forEach(tab => {
      if (tabs[tab.level]) {
        tabs[tab.level].push(tab);
      } else {
        tabs[tab.level] = [tab];
      }
    });
  } catch (e) {
    console.warn(e);
  }

  return tabs;
};

export const parseColumns = (columns?: Etendo.Field[]): Etendo.Column[] => {
  const result: Etendo.Column[] = [];

  try {
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
  } catch (e) {
    console.warn(e);
  }

  return result;
};

const inputNameCache: Record<string, string> = {};

export function getInputName(field: Field) {
  return field.fieldName;
}

// export function getInputName(field: Field) {
//   try {
//     if (!inputNameCache[field.inpName]) {
//       inputNameCache[field.inpName] = `inp${field.inpName}`;
//     }

//     return inputNameCache[field.inpName];
//   } catch (e) {
//     console.warn(field, e);

//     return '';
//   }
// }

export const buildFormState = (fields: Tab['fields'], record: Record<string, unknown>) => {
  try {
    return Object.entries(fields).reduce((state, [fieldName, field]) => {
      state[fieldName] = record[fieldName];

      return state;
    }, {} as Record<string, unknown>);
  } catch (e) {
    console.warn(e);

    return {};
  }
};

export const isEntityReference = (type: FieldType) => ['tabledir', 'search'].includes(type);

export const getFieldsByDBColumnName = (tab: Tab) => {
  try {
    return Object.entries(tab.fields).reduce((acc, [f, field]) => {
      acc[field.column.dBColumnName] = field;

      if (!field.column.dBColumnName?.length) {
        console.error(JSON.stringify(field, null, 2));
      }

      return acc;
    }, {} as Record<string, Field>);
  } catch (e) {
    console.warn(e);

    return {};
  }
};

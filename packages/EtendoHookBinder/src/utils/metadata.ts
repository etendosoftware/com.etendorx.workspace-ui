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
        let columnType = '';

        if (column.column?.reference$_identifier) {
          columnType = column.column.reference$_identifier;
        }

        result.push({
          header: column.title ?? column.name ?? column.hqlName,
          id: column.name,
          columnName: column.hqlName,
          isMandatory: column.required,
          _identifier: column.title,
          column: {
            _identifier: columnType,
          },
          name: column.name,
          type: columnType,
          accessorFn: (v: Record<string, unknown>) => {
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

export const buildFormState = (
  fields: Tab['fields'],
  record: Record<string, unknown>,
  formState: Record<string, Record<string, never>>,
) => {
  try {
    const result = Object.entries(fields).reduce(
      (state, [, field]) => {
        const inputName = field.inputName;

        if (inputName?.length) {
          state[inputName] = record[field.hqlName];
        } else {
          console.warn('Missing field input name for', JSON.stringify(field, null, 2));
        }

        return state;
      },
      {} as Record<string, unknown>,
    );

    const auxiliaryInputValues = formState?.auxiliaryInputValues;

    if (auxiliaryInputValues) {
      Object.entries(auxiliaryInputValues).forEach(([inputName, { value }]) => {
        result[inputName] = value;
      });
    }

    return result;
  } catch (e) {
    console.warn(e);

    return {};
  }
};

export const isEntityReference = (type: FieldType) => ['tabledir', 'search'].includes(type);

export const getFieldsByDBColumnName = (tab: Tab) => {
  try {
    return Object.entries(tab.fields).reduce(
      (acc, [, field]) => {
        acc[field.column.dBColumnName] = field;

        if (!field.column.dBColumnName?.length) {
          console.error(JSON.stringify(field, null, 2));
        }

        return acc;
      },
      {} as Record<string, Field>,
    );
  } catch (e) {
    console.warn(e);

    return {};
  }
};

export const getFieldsByName = (tab: Tab) => {
  try {
    return Object.entries(tab.fields).reduce(
      (acc, [, field]) => {
        acc[field.inputName] = field;

        return acc;
      },
      {} as Record<string, Field>,
    );
  } catch (e) {
    console.warn(e);

    return {};
  }
};

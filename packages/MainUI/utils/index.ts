import { Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sanitizeValue = (value: unknown, key: string): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value == null) {
    return "";
  }

  if (typeof value === 'boolean') {
    return value ? 'Y' : 'N';
  }

  return String(value);
};

export const getCombinedEntries = (formInitialization: FormInitializationResponse) => [
  ...Object.entries(formInitialization.auxiliaryInputValues),
  ...Object.entries(formInitialization.columnValues),
];

export const buildUpdatedValues = (
  entries: [string, { value: unknown }][],
  fieldsByColumnName: Record<string, { hqlName?: string }>,
) => {
  return entries.reduce(
    (acc, [columnName, { value }]) => {
      const key = fieldsByColumnName[columnName]?.hqlName ?? columnName;
      acc[key] = sanitizeValue(value, key);
      return acc;
    },
    {} as Record<string, string | number | boolean | null>,
  );
};

export const buildPayloadByInputName = (values: Record<string, unknown>, fields?: Record<string, Field>) =>
  Object.entries(values).reduce(
    (acc, [key, value]) => {
      const newKey = fields?.[key]?.inputName;

      if (newKey) {
        acc[newKey] = value;
      }

      return acc;
    },
    {} as Record<string, unknown>,
  );

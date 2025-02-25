import { Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sanitizeValue = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/[<>]/g, '') : String(value ?? '');

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
      acc[key] = sanitizeValue(value);
      return acc;
    },
    {} as Record<string, string | number | boolean | null>,
  );
};

export const buildCalloutPayload = (values: Record<string, unknown>, fields: Record<string, Field>) =>
  Object.entries(values).reduce(
    (acc, [key, value]) => {
      acc[fields[key]?.inputName ?? key] = value;

      return acc;
    },
    {} as Record<string, unknown>,
  );

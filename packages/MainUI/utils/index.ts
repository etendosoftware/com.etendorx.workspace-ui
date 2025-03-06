import { Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getFieldReference = (field?: Field) => {
  switch (field?.column?.reference) {
    case '19':
    case '95E2A8B50A254B2AAE6774B8C2F28120':
    case '18':
      return 'TableDirSelector';
    case '15':
    case '16':
      return 'DateSelector';
    case '20':
      return 'BooleanSelector';
    case '29':
      return 'QuantitySelector';
    case '17':
    case '13':
      return 'ListSelector';
    case '30':
      return 'SelectSelector';
    case '12':
    case '11':
    case '22':
    default:
      return 'StringSelector';
  }
};

export const sanitizeValue = (field: Field | undefined, value: unknown) => {
  const reference = getFieldReference(field);

  if (reference === "BooleanSelector") {
    return value ? 'Y' : 'N';
  }

  if (reference === 'QuantitySelector') {
    return value;
  }

  if (value == null) {
    return '';
  }

  return value;
};

export const getCombinedEntries = (formInitialization: FormInitializationResponse) => [
  ...Object.entries(formInitialization.auxiliaryInputValues),
  ...Object.entries(formInitialization.columnValues),
];

export const buildUpdatedValues = (
  entries: [string, { value: string; identifier?: string }][],
  fieldsByColumnName: Record<string, Field>,
) => {
  return entries.reduce(
    (acc, [columnName, { value }]) => {
      const field = fieldsByColumnName[columnName];
      const key = field?.hqlName ?? columnName;
      acc[key] = sanitizeValue(field, value);
      return acc;
    },
    {} as Record<string, unknown>,
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

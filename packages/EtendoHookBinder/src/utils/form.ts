import { Field, Tab } from '../api/types';

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
  Object.entries(fields).reduce((state, [fieldName, field]) => {
    state[getInputName(field)] = record[fieldName];

    return state;
  }, {} as Record<string, unknown>);

import { Field, Tab } from '../api/types';

const inputNameCache: Record<string, string> = {};

export function getInputName(field: Field) {
  console.log('calling getInputName for ', field.name);

  if (!inputNameCache[field.inpName]) {
    inputNameCache[field.inpName] = `inp${field.inpName}`
  }

  return inputNameCache[field.inpName];
}

export const buildFormState = (fields: Tab['fields'], record: Record<string, unknown>) =>
  Object.entries(fields).reduce((state, [fieldName, field]) => {
    state[getInputName(field)] = record[fieldName];

    return state;
  }, {} as Record<string, unknown>);

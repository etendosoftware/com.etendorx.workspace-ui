import { Tab } from "@workspaceui/etendohookbinder/src/api/types";

export function buildClassicRecordPayload(fields: Tab['fields'], record: Gen) {
  return Object.entries(tab.fields).reduce((acc, [fieldName, field]) => {
    acc['inp' + field.inpName] = record[fieldName]; // fieldName in record ? record[fieldName] : 'TUVIEJA';

    return acc;
  }, {} as Record<string, any>);
}

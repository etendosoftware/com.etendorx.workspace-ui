import { FieldType, FieldInfo, FormData, Section } from '../screens/Form/types';
import {
  Column,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';

export function mapColumnTypeToFieldType(column: Column): FieldType {
  switch (column?.column?.reference) {
    // case '19':
    //   return 'tabledir';
    case '15':
    case '16':
      return 'date';
    case '20':
      return 'boolean';
    case '17':
    case '30':
    case '18':
    case '11':
    case '12':
    case '29':
    case '22':
    case '800008':
    default:
      return 'text';
  }
}

export function ensureFieldValue(
  value: unknown,
): string | number | boolean | Date | string[] {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value) && value.every(item => typeof item === 'string'))
    return value;
  return String(value);
}

export function adaptFormData(
  windowData: WindowMetadata,
  columnsData: Record<string, Record<string, Column>>,
  record: Record<string, unknown>,
): FormData | null {
  if (!windowData || !columnsData || !record) return null;

  const adaptedData: FormData = {};
  const tabId = windowData.tabs[0]?.id;

  if (!tabId || !columnsData[tabId]) {
    console.error('No tab data found for the first tab');
    return null;
  }

  // Create sections
  const sections = new Set<string>(['Main']);
  Object.values(columnsData[tabId]).forEach(column => {
    const fieldInfo = windowData.tabs?.[0]?.fields?.[column.columnName] as
      | FieldInfo
      | undefined;
    const sectionName = fieldInfo?.fieldGroup$_identifier;
    if (sectionName) sections.add(sectionName);
  });

  sections.forEach(sectionName => {
    adaptedData[sectionName] = {
      name: sectionName,
      label: sectionName === 'Main' ? windowData.name : sectionName,
      type: 'section',
      personalizable: false,
      id: sectionName,
      showInTab: 'both',
    } as Section;
  });

  // Add fields to sections
  Object.entries(columnsData[tabId]).forEach(([fieldName, column]) => {
    const fieldInfo = windowData.tabs?.[0]?.fields?.[fieldName] as
      | FieldInfo
      | undefined;
    const sectionName = fieldInfo?.fieldGroup$_identifier ?? 'Main';
    const rawValue = record[`${fieldName}$_identifier`] ?? record[fieldName];
    const safeValue = ensureFieldValue(rawValue);

    adaptedData[fieldName] = {
      value: safeValue,
      type: mapColumnTypeToFieldType(column),
      label: column.name,
      section: sectionName,
      required: column.isMandatory ?? true,
      referencedTable: column.column?.reference,
    };
  });

  return adaptedData;
}

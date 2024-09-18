import {
  FieldType,
  FieldInfo,
  FormData,
  FieldDefinition,
  Section,
} from '../screens/Form/types';
import {
  Column,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';

export function mapColumnTypeToFieldType(reference: string): FieldType {
  switch (reference) {
    case '19':
      return 'tabledir';
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
  columnsData: Column[],
  records: Record<string, unknown>[],
): FormData | null {
  if (!windowData || !columnsData || !records || records.length === 0)
    return null;

  const adaptedData: FormData = {};
  const sections = new Set<string>(['Main']);

  // Create sections
  columnsData.forEach((column: Column) => {
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

  const record = records[0] ?? {};
  columnsData.forEach((column: Column) => {
    const fieldName = column.columnName;
    const fieldInfo = windowData.tabs?.[0]?.fields?.[fieldName] as
      | FieldInfo
      | undefined;
    const sectionName = fieldInfo?.fieldGroup$_identifier ?? 'Main';
    const rawValue = record[`${fieldName}$_identifier`] ?? record[fieldName];
    const safeValue = ensureFieldValue(rawValue);

    adaptedData[fieldName] = {
      value: safeValue,
      type: mapColumnTypeToFieldType(column.column.reference),
      label: column.name,
      section: sectionName,
      required: column.isMandatory ?? true,
    } as FieldDefinition;
  });

  return adaptedData;
}

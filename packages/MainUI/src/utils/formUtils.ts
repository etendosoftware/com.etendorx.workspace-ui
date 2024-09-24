import {
  FieldType,
  FieldInfo,
  FormData,
  Section,
  FieldDefinition,
} from '../screens/Form/types';
import {
  Column,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';

export function mapColumnTypeToFieldType(column: Column): FieldType {
  console.log('Mapping column type:', column);

  if (!column || !column?.reference) {
    console.warn('Invalid column data:', column);
    return 'text';
  }
  switch (column?.reference) {
    case '19':
      return 'tabledir';
    case '15':
    case '16':
      return 'date';
    case '20':
      return 'boolean';
    case '12':
      return 'number';
    case '17':
    case '30':
    case '18':
    case '11':
    case '29':
    case '22':
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

export function mapWindowMetadata(windowData: WindowMetadata) {
  const mappedData: any = {
    name: windowData.name,
    id: windowData.id,
    tabs: [],
  };

  windowData.tabs.forEach(tab => {
    const mappedTab: any = {
      id: tab.id,
      name: tab._identifier,
      fields: {},
    };

    Object.entries(tab.fields).forEach(([fieldName, fieldInfo]) => {
      mappedTab.fields[fieldName] = {
        name: fieldName,
        label: fieldInfo.column.name,
        type: mapColumnTypeToFieldType(fieldInfo.column),
        referencedTable: fieldInfo.column.reference,
        required: fieldInfo.column.isMandatory,
      };
    });

    mappedData.tabs.push(mappedTab);
  });

  return mappedData;
}

export function adaptFormData(
  windowData: WindowMetadata,
  record: Record<string, unknown>,
): FormData | null {
  console.log('adaptFormData called with:', { windowData, record });

  if (!windowData || !record) {
    console.log('windowData or record is null/undefined');
    return null;
  }

  const adaptedData: FormData = {};
  const sections = new Set<string>(['Main']);

  // Create sections
  Object.values(windowData.tabs[0].fields).forEach((field: FieldInfo) => {
    const sectionName = field.fieldGroup$_identifier;
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

  Object.entries(windowData.tabs[0].fields).forEach(
    ([fieldName, fieldInfo]) => {
      const sectionName = fieldInfo.fieldGroup$_identifier ?? 'Main';
      const rawValue = record[`${fieldName}$_identifier`] ?? record[fieldName];
      const safeValue = ensureFieldValue(rawValue);

      adaptedData[fieldName] = {
        value: safeValue,
        type: mapColumnTypeToFieldType(fieldInfo.column),
        label: fieldInfo.column.name,
        section: sectionName,
        required: fieldInfo.column.isMandatory ?? true,
        referencedTable: fieldInfo.column.reference,
        original: {
          fieldName,
          ...fieldInfo,
        },
      } as unknown as FieldDefinition;
    },
  );

  console.log('adaptedData:', adaptedData);
  return adaptedData;
}

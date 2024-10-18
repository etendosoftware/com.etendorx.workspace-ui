import { FieldType, FieldInfo, FormData, Section, FieldDefinition } from '../screens/Form/types';
import { Column, MappedData, MappedTab, WindowMetadata } from '@workspaceui/etendohookbinder/api/types';

export function mapColumnTypeToFieldType(column: Column): FieldType {
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
    case '29':
      return 'quantity';
    case '17':
      return 'list';
    case '12':
    case '30':
    case '18':
    case '11':
    case '22':
    default:
      return 'text';
  }
}

export function ensureFieldValue(value: unknown): string | number | boolean | Date | string[] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) return value;
  return String(value);
}

export function mapWindowMetadata(windowData: WindowMetadata): MappedData {
  const mappedData: MappedData = {
    name: windowData.name,
    id: windowData.id,
    tabs: [],
  };

  windowData.tabs.forEach(tab => {
    const mappedTab: MappedTab = {
      id: tab.id,
      name: tab._identifier,
      fields: {},
    };

    Object.entries(tab.fields).forEach(([fieldName, fieldInfo]) => {
      const column = fieldInfo.column as Column;
      mappedTab.fields[fieldName] = {
        name: fieldName,
        label: column.name,
        type: mapColumnTypeToFieldType(column),
        referencedTable: column.reference,
        required: column.isMandatory,
      };
    });

    mappedData.tabs.push(mappedTab);
  });

  return mappedData;
}

export function adaptFormData(windowData: WindowMetadata, record: Record<string, unknown>): FormData | null {
  if (!windowData || !record) {
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

  Object.entries(windowData.tabs[0].fields).forEach(([fieldName, fieldInfo]) => {
    const column = fieldInfo.column as Column;
    const sectionName = fieldInfo.fieldGroup$_identifier ?? 'Main';
    const rawValue = record[fieldName];
    let safeValue;

    if (mapColumnTypeToFieldType(column) === 'tabledir') {
      safeValue = {
        id: rawValue,
        title: record[`${fieldName}$_identifier`] || rawValue,
        value: rawValue,
      };
    } else {
      safeValue = ensureFieldValue(rawValue);
    }

    adaptedData[fieldName] = {
      value: safeValue,
      type: mapColumnTypeToFieldType(column),
      label: fieldInfo.column.name,
      section: sectionName,
      required: fieldInfo.column.isMandatory ?? true,
      referencedTable: fieldInfo.column.reference,
      original: {
        fieldName,
        ...fieldInfo,
      },
    } as unknown as FieldDefinition;
  });

  return adaptedData;
}

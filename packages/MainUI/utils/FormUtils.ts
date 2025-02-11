import { FormData, Section } from '@/components/Form/FormView/types';
import {
  Column,
  Field,
  FieldDefinition,
  FieldType,
  MappedData,
  MappedTab,
  Tab,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';
import { UseFormReturn } from 'react-hook-form';

export function mapColumnTypeToFieldType(column: Column): FieldType {
  if (!column || !column?.reference) {
    console.warn('Invalid column data:', column);
    return 'text';
  }

  switch (column?.reference) {
    case '19':
    case '95E2A8B50A254B2AAE6774B8C2F28120':
    case '18':
      return 'tabledir';
    case '15':
    case '16':
      return 'date';
    case '20':
      return 'boolean';
    case '29':
      return 'quantity';
    case '17':
    case '13':
      return 'list';
    case '30':
      return 'search';
    case '12':
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
      const column = fieldInfo.column as unknown as Column;
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

export function adaptFormData(tab: Tab, record: Record<string, unknown>): FormData | null {
  if (!tab || !record) return null;

  const adaptedData: FormData = {};
  const sections = new Set<string>(['Main', 'Status']);

  const statusBarFields: Field[] = [];
  const regularFields: Field[] = [];

  Object.values(tab.fields).forEach((field: Field) => {
    if (field.shownInStatusBar) {
      statusBarFields.push(field);
    } else {
      regularFields.push(field);
      const sectionName = field.fieldGroup$_identifier;
      if (sectionName) sections.add(sectionName);
    }
  });

  sections.forEach(sectionName => {
    adaptedData[sectionName] = {
      name: sectionName,
      label: sectionName === 'Main' ? tab.title : sectionName,
      type: 'section',
      personalizable: false,
      id: sectionName,
      showInTab: sectionName === 'Status' ? 'status' : 'both',
    } as Section;
  });

  statusBarFields.forEach(fieldInfo => {
    const column = fieldInfo.column as unknown as Column;
    const fieldName = (fieldInfo.columnName || column.dBColumnName || '') as string;
    const fieldType = mapColumnTypeToFieldType(column);

    const rawValue = fieldName ? record[fieldName] ?? record[column.dBColumnName as string] : undefined;
    const identifierValue =
      record[`${fieldName}$_identifier`] ??
      record[`${column.dBColumnName}$_identifier`] ??
      record[`${fieldName}_identifier`];

    let value = rawValue;
    if (fieldType === 'tabledir' && rawValue) {
      value = {
        id: rawValue,
        title: identifierValue || String(rawValue),
        value: rawValue,
        _identifier: identifierValue,
      };
    }

    adaptedData[fieldName] = {
      value: value,
      displayValue: identifierValue || value,
      initialValue: value,
      type: fieldType,
      label: column.name,
      section: 'Status',
      required: column.mandatory ?? false,
      referencedTable: column.reference,
      original: {
        ...fieldInfo,
        fieldName,
        column,
      },
    } as unknown as FieldDefinition;
  });

  regularFields.forEach(fieldInfo => {
    const column = fieldInfo.column as unknown as Column;
    const fieldName = fieldInfo.name || fieldInfo.column.dBColumnName;
    const sectionName = fieldInfo.fieldGroup$_identifier ?? 'Main';
    const fieldType = mapColumnTypeToFieldType(column);

    const dbColumnName = fieldInfo.column.dBColumnName;
    const rawValue = record[dbColumnName] ?? record[fieldName];
    const identifierValue =
      record[`${dbColumnName}$_identifier`] ?? record[`${fieldName}$_identifier`] ?? record[`${fieldName}_identifier`];

    let value = rawValue;
    if (fieldType === 'tabledir' && rawValue) {
      value = {
        id: rawValue,
        title: identifierValue || String(rawValue),
        value: rawValue,
        _identifier: identifierValue,
      };
    }

    adaptedData[fieldName] = {
      value: value,
      initialValue: value,
      type: fieldType,
      label: fieldInfo.column.name,
      section: sectionName,
      required: fieldInfo.column.isMandatory ?? true,
      referencedTable: fieldInfo.column.reference,
      original: {
        ...fieldInfo,
        fieldName,
      },
    } as unknown as FieldDefinition;
  });

  return adaptedData;
}

export const parseDynamicExpression = (expr: string) =>
  expr
    .replace(/OB\.Utilities\.getValue\((\w+),\s*['"]([^'"]+)['"]\)/g, '$1["$2"]')
    .replace(/context\.(\$?\w+)/g, (_, prop) => `context.${prop}`);

export const getMappedValues = (fieldsByInputName: Record<string, Field>, form: UseFormReturn) =>
  Object.entries(form.getValues()).reduce((acc, [inputName, inputValue]) => {
    const theField = fieldsByInputName[inputName];

    if (theField) {
      acc[theField.columnName] = inputValue;
    } else {
      acc[inputName] = inputValue;
    }

    return acc;
  }, {} as Record<string, unknown>);

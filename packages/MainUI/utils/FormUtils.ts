import { FormData, Section } from '@/components/Form/FormView/types';
import { Column, Field, FieldDefinition, FieldInfo, FieldType, Tab } from '@workspaceui/etendohookbinder/src/api/types';
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

export function adaptFormData(tab: Tab, record: Record<string, unknown>): FormData | null {
  if (!tab || !record) return null;

  const adaptedData: FormData = {};
  const sections = new Set<string>(['Main']);

  Object.values(tab.fields).forEach((field: FieldInfo) => {
    const sectionName = field.fieldGroup$_identifier;
    if (sectionName) sections.add(sectionName);
  });

  sections.forEach(sectionName => {
    adaptedData[sectionName] = {
      name: sectionName,
      label: sectionName === 'Main' ? tab.title : sectionName,
      type: 'section',
      personalizable: false,
      id: sectionName,
      showInTab: 'both',
    } as Section;
  });

  Object.entries(tab.fields).forEach(([fieldName, fieldInfo]) => {
    const column = fieldInfo.column as unknown as Column;
    const sectionName = fieldInfo.fieldGroup$_identifier ?? 'Main';
    const fieldType = mapColumnTypeToFieldType(column);

    const dbColumnName = fieldInfo.column.dBColumnName;
    const rawValue = record[dbColumnName] ?? record[fieldName];
    const identifierValue =
      record[`${dbColumnName}$_identifier`] ?? record[`${fieldName}$_identifier`] ?? record[`${fieldName}_identifier`];

    let value;
    if (fieldType === 'tabledir' && rawValue) {
      value = {
        id: rawValue,
        title: identifierValue || String(rawValue),
        value: rawValue,
        _identifier: identifierValue,
      };
    } else {
      // ...
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

export const parseDynamicExpression = (expr: string) =>
  expr
    .replace(/OB\.Utilities\.getValue\((\w+),\s*['"]([^'"]+)['"]\)/g, '$1["$2"]')
    .replace(/context\.(\$?\w+)/g, (_, prop) => `context.${prop}`);

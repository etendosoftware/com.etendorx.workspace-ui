import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormView from '@workspaceui/componentlibrary/src/components/FormView';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import {
  FieldDefinition,
  Section,
} from '@workspaceui/storybook/stories/Components/Table/types';
import {
  Column,
  WindowMetadata,
} from '@workspaceui/etendohookbinder/src/api/types';

interface FieldInfo {
  fieldGroup$_identifier?: string;
}

function mapColumnTypeToFieldType(
  reference: string,
): 'text' | 'number' | 'date' | 'boolean' | 'select' {
  switch (reference) {
    case '11': // Integer
    case '12': // Amount
    case '29': // Quantity
    case '22': // Number
    case '800008': // Price
      return 'number';
    case '15': // Date
    case '16': // DateTime
      return 'date';
    case '20': // YesNo
      return 'boolean';
      return 'select';
    case '17': // List
    case '30': // Search
    case '18': // Table
    case '19': // TableDir
    default:
      return 'text';
  }
}

const ensureFieldValue = (
  value: unknown,
): string | number | boolean | Date | string[] => {
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
};

export default function DynamicFormView() {
  const { id, recordId } = useParams<{ id: string; recordId: string }>();
  const navigate = useNavigate();
  const {
    windowData,
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useWindow(id ?? '');
  const [formData, setFormData] = useState<Record<
    string,
    FieldDefinition | Section
  > | null>(null);

  const {
    records,
    loading: recordLoading,
    error: recordError,
    loaded,
  } = useDatasource(windowData as WindowMetadata, {
    criteria: [{ fieldName: 'id', operator: 'equals', value: recordId }],
  });

  const adaptFormData = useCallback(() => {
    if (!windowData || !columnsData || !records || records.length === 0)
      return null;

    const adaptedData: Record<string, FieldDefinition | Section> = {};
    const sections = new Set<string>(['Main']);

    columnsData.forEach((column: Column) => {
      const fieldName = column.columnName;
      const fieldInfo = windowData.tabs?.[0]?.fields?.[fieldName] as
        | FieldInfo
        | undefined;
      const sectionName = fieldInfo?.fieldGroup$_identifier;
      if (sectionName) sections.add(sectionName);
    });

    if (sections.size === 0) sections.add('Main');

    sections.forEach(sectionName => {
      adaptedData[sectionName] = {
        name: sectionName,
        label: sectionName === 'Main' ? windowData.name : sectionName,
        type: 'section',
        personalizable: false,
        id: sectionName,
        showInTab: 'both',
      };
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
        label: column.columnName,
        section: sectionName,
        required: column.isMandatory ?? true,
      } as FieldDefinition;
    });

    return adaptedData;
  }, [windowData, columnsData, records]);

  useEffect(() => {
    const newFormData = adaptFormData();
    if (newFormData) setFormData(newFormData);
  }, [adaptFormData]);

  const handleSave = useCallback(() => navigate('/'), [navigate]);
  const handleCancel = useCallback(() => navigate('/'), [navigate]);

  if (windowLoading && recordLoading && !loaded) return <Spinner />;
  if (windowError || recordError)
    return <div>Error: {windowError?.message || recordError?.message}</div>;
  if (!formData) return <div>No data available</div>;

  return (
    <FormView data={formData} onSave={handleSave} onCancel={handleCancel} />
  );
}

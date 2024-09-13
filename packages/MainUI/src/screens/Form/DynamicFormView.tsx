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
import { WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';

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
    case '17': // List
    case '30': // Search
      return 'select';
    case '18': // Table
    case '19': // TableDir
    default:
      return 'text';
  }
}

export default function DynamicFormView() {
  const { id, recordId } = useParams<{ id: string; recordId: string }>();
  const navigate = useNavigate();
  const { windowData, columnsData, loading, error } = useWindow(id || '');
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
    criteria: [
      {
        fieldName: 'id',
        operator: 'equals',
        value: recordId,
      },
    ],
  });
  useEffect(() => {
    if (windowData && columnsData && records && records.length > 0) {
      const adaptedData: Record<string, FieldDefinition | Section> = {};

      const sections = new Set<string>();
      columnsData.forEach(column => {
        const fieldInfo = windowData.tabs[0].fields[column.columnName];
        if (fieldInfo && fieldInfo.fieldGroup$_identifier) {
          sections.add(fieldInfo.fieldGroup$_identifier);
        }
      });

      sections.forEach(sectionName => {
        adaptedData[sectionName] = {
          name: sectionName,
          label: sectionName,
          type: 'section',
          personalizable: false,
          id: sectionName,
          showInTab: 'both',
        };
      });

      if (sections.size === 0 || !sections.has('Main')) {
        adaptedData['Main'] = {
          name: 'Main',
          label: windowData.name,
          type: 'section',
          personalizable: false,
          id: 'main',
          showInTab: 'both',
        };
      }

      const record = records[0] ?? {};

      columnsData.forEach(column => {
        console.log('Processing column:', column);
        const fieldName = column.columnName;
        const fieldInfo = windowData.tabs[0].fields[fieldName];
        const sectionName = fieldInfo?.fieldGroup$_identifier || 'Main';

        console.debug({
          column,
          windowData: windowData,
          name: fieldName,
          data: record,
          value: record[`${fieldName}$_identifier`] ?? record[fieldName],
          section: sectionName,
        });

        adaptedData[fieldName] = {
          value: record[`${fieldName}$_identifier`] ?? record[fieldName],
          type: mapColumnTypeToFieldType(column.column.reference),
          label: column.columnName,
          section: sectionName,
          required: column.column.mandatory,
        };
      });

      setFormData(adaptedData);
    }
  }, [windowData, columnsData, records]);

  const handleSave = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (loading && recordLoading && !loaded) {
    return <Spinner />;
  }

  if (error || recordError) {
    return <div>Error: {error?.message || recordError?.message}</div>;
  }

  if (!formData) {
    return <div>No data available</div>;
  }

  console.log('Rendering FormView with data:', formData);

  return (
    <FormView data={formData} onSave={handleSave} onCancel={handleCancel} />
  );
}

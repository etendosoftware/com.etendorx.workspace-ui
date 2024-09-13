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
  } = useDatasource(windowData, {
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
      console.log('Adapting data...');
      const adaptedData: Record<string, FieldDefinition | Section> = {
        _mainSection: {
          name: '_mainSection',
          label: windowData.name,
          type: 'section',
          personalizable: false,
          id: 'main',
          showInTab: 'both',
        },
      };

      const record = records[0] ?? {};

      columnsData.forEach(column => {
        console.log('Processing column:', column);
        const fieldName = column.columnName;
        console.debug({
          column,
          name: fieldName,
          data: records[0],
          value: record[`${fieldName}$_identifier`] ?? record[fieldName],
        });
        adaptedData[fieldName] = {
          value: record[`${fieldName}$_identifier`] ?? record[fieldName],
          type: mapColumnTypeToFieldType(column.column.reference),
          label: column.name,
          section: '_mainSection',
          required: column.column.mandatory,
        };
      });

      console.log('Adapted Data:', adaptedData);
      setFormData(adaptedData);
    }
  }, [windowData, columnsData, records]);

  const handleSave = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCancel = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (loading || recordLoading) {
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
    case '18': // Table
    case '19': // TableDir
    case '30': // Search
      return 'select';
    default:
      return 'text';
  }
}

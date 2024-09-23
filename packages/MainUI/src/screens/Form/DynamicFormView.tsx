import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import { useEntityRecord } from '@workspaceui/etendohookbinder/src/hooks/useEntityRecord';
import FormView from './FormView';
import { Organization, Section, FieldDefinition } from './types';

export default function DynamicFormView() {
  const { recordId = '' } = useParams<{ recordId: string }>();

  const {
    windowData,
    loading: windowLoading,
    error: windowError,
  } = useMetadataContext();

  const {
    data,
    loading: recordLoading,
    error: recordError,
  } = useEntityRecord(windowData?.tabs[0].entityName ?? '', recordId);

  const [formData, setFormData] = useState<Organization>({});

  const adaptedData: Organization = useMemo(() => {
    if (!windowData || !data) return {};

    const result: Organization = {};

    // Create main section
    result['_mainSection'] = {
      id: '_mainSection',
      type: 'section',
      label: windowData.name,
      icon: null,
      fill: null,
      hoverFill: null,
      showInTab: true,
    } as Section;

    // Adapt fields
    Object.entries(windowData.tabs[0].fields).forEach(([key, value]) => {
      const fieldValue = data[`${key}$_identifier`] ?? data[key] ?? '';
      result[key] = {
        value: fieldValue,
        type: mapColumnTypeToFieldType(value.column),
        label: value.column.name,
        section: '_mainSection',
        required: value.column.isMandatory ?? true,
      } as FieldDefinition;
    });

    return result;
  }, [windowData, data]);

  const handleInputChange = useCallback(
    (name: string, value: string | number | boolean | string[] | Date) => {
      setFormData(prevData => ({
        ...prevData,
        [name]: {
          ...prevData[name],
          value: value,
        } as FieldDefinition,
      }));
    },
    [],
  );

  if (windowLoading || recordLoading) {
    return <Spinner />;
  } else if (windowError || recordError) {
    return <div>Error: {windowError?.message ?? recordError?.message}</div>;
  } else if (adaptedData) {
    return (
      <FormView
        data={adaptedData}
        readOnly={false}
        gridItemProps={{}}
        dottedLineInterval={1}
      />
    );
  } else {
    return null;
  }
}

function mapColumnTypeToFieldType(column: any): string {
  switch (column?.reference) {
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

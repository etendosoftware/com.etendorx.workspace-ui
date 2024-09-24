import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useParams } from 'react-router-dom';

interface TableDirSelectorProps {
  name: string;
  field: any;
  onChange: (name: string, value: string) => void;
}

interface Option {
  id: string;
  name: string;
}

const TableDirSelector: React.FC<TableDirSelectorProps> = ({
  name,
  field,
  onChange,
}) => {
  const { id } = useParams<{ id: string }>();
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    windowData,
    loading: windowLoading,
    error: windowError,
  } = useWindow(id ?? '');

  const fieldMetadata = useMemo(() => {
    return windowData?.tabs?.[0]?.fields?.[name];
  }, [windowData, name]);

  const entityName = useMemo(() => {
    if (!fieldMetadata) return null;
    const reference = fieldMetadata.column?.reference;
    console.log('Reference:', reference);
    if (reference === '19') {
      return 'ADClient';
    }
    return null;
  }, [fieldMetadata]);

  console.log('Field Metadata:', fieldMetadata);
  console.log('Entity Name:', entityName);

  const datasourceParams = useMemo(() => {
    if (!entityName) return null;
    return {
      entityName,
      criteria: [{ fieldName: 'active', operator: 'equals', value: true }],
    };
  }, [entityName]);

  const {
    records,
    loading: dataLoading,
    error: datasourceError,
  } = useDatasource(entityName);

  const formatOptions = useCallback((records: any[]) => {
    return records.map(record => ({
      id: record.id,
      name: record._identifier || record.name || record.id,
    }));
  }, []);

  useEffect(() => {
    if (windowLoading) {
      setLoading(true);
      return;
    }

    if (windowError) {
      setErrorMessage(`Error loading window data: ${windowError.message}`);
      setLoading(false);
      return;
    }

    if (!entityName) {
      setErrorMessage('No entity name found for this field');
      setLoading(false);
      return;
    }

    if (datasourceError) {
      setErrorMessage(`Error loading data: ${datasourceError.message}`);
      setLoading(false);
      return;
    }

    if (!dataLoading && records) {
      try {
        const formattedOptions = formatOptions(records);
        console.log('Formatted Options:', formattedOptions);
        setOptions(formattedOptions);
        setLoading(false);
      } catch (e) {
        console.error('Error formatting options:', e);
        setErrorMessage('Error formatting data');
        setLoading(false);
      }
    }
  }, [
    windowLoading,
    windowError,
    entityName,
    dataLoading,
    datasourceError,
    records,
    formatOptions,
  ]);

  if (loading || windowLoading || dataLoading) {
    return <Spinner />;
  }

  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }

  return (
    <FormControl fullWidth>
      <InputLabel id={`${name}-label`}>{field.label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        value={field.value}
        label={field.label}
        onChange={e => onChange(name, e.target.value as string)}>
        {options.map(option => (
          <MenuItem key={option.id} value={option.id}>
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TableDirSelector;

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useParams } from 'react-router-dom';
import Select from '../../../../ComponentLibrary/src/components/Input/Select';
import SearchOutlined from '../../../../ComponentLibrary/src/assets/icons/search.svg';
import { theme } from '../../../../ComponentLibrary/src/theme';
import { TableDirSelectorProps, Option } from './types';

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

  const tabData = useMemo(() => {
    return windowData?.tabs?.[0];
  }, [windowData]);

  const fieldMetadata = useMemo(() => {
    return tabData?.fields?.[name];
  }, [tabData, name]);

  const entityName = useMemo(() => {
    if (!fieldMetadata) return null;
    return fieldMetadata.entity || null;
  }, [fieldMetadata]);

  const {
    records,
    loading: dataLoading,
    error: datasourceError,
  } = useDatasource(entityName ?? '');

  const formatOptions = useCallback((records: any[]): Option[] => {
    return records.map(record => ({
      id: record.id,
      title: record._identifier || record.name || record.id,
      value: record.id,
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
        setOptions(formattedOptions);
        setLoading(false);
      } catch (e) {
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

  const handleChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
      if (value) {
        onChange(name, value.id);
      }
    },
    [name, onChange],
  );

  const selectedValue = useMemo(() => {
    const selectedOption = options.find(
      option => option.id === String(field.value),
    );
    return selectedOption?.id;
  }, [options, field.value]);

  if (loading || windowLoading || dataLoading) {
    return <Spinner />;
  }

  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }

  return (
    <Select
      iconLeft={
        <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
      }
      title={field.label || ''}
      options={options}
      onChange={handleChange}
      value={selectedValue}
      getOptionLabel={(option: Option) => option.title}
    />
  );
};

export default TableDirSelector;

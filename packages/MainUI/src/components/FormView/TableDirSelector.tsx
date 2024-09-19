import React, { useEffect, useState, useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import Select from '../../../../ComponentLibrary/src/components/Input/Select';
import SearchOutlined from '../../../../ComponentLibrary/src/assets/icons/search.svg';
import { theme } from '../../../../ComponentLibrary/src/theme';
import { useParams } from 'react-router-dom';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';

interface TableDirSelectorProps {
  name: string;
  field?: {
    value: string;
    type: string;
    label: string;
    section: string;
    required: boolean;
  };
  onChange: (name: string, value: string) => void;
}

interface Option {
  id: string;
  title: string;
  value: string;
}

const TableDirSelector: React.FC<TableDirSelectorProps> = ({
  name,
  field,
  onChange,
}) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { id: currentWindowId } = useParams<{ id: string }>();

  console.log('TableDirSelector props:', { name, field });

  const {
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useWindow(currentWindowId ?? '');

  const fieldMetadata = useMemo(() => {
    return columnsData?.find(column => column.columnName === name);
  }, [columnsData, name]);

  const columnIdentifier = fieldMetadata?.column?._identifier;

  const datasourceParams = useMemo(() => {
    if (!columnIdentifier) return null;
    const [entity] = columnIdentifier.split('.');
    if (!entity) return null;
    return {
      entity,
      tabId: 'reference',
    };
  }, [columnIdentifier]);

  console.log('Datasource params:', datasourceParams);

  const {
    records,
    loading: entityLoading,
    error: entityError,
  } = useDatasource(
    datasourceParams
      ? {
          tabs: [
            { entityName: datasourceParams.entity, id: datasourceParams.tabId },
          ],
        }
      : null,
    datasourceParams ? { reference: true } : null,
  );

  useEffect(() => {
    if (records && records.length > 0) {
      const formattedOptions = records.map(record => ({
        id: record.id,
        title: record._identifier || record.id,
        value: record.id,
      }));
      setOptions(formattedOptions);
    }
    setIsLoading(false);
  }, [records]);

  if (windowLoading || entityLoading || isLoading) return <Spinner />;
  if (windowError)
    return <div>Error loading window data: {windowError.message}</div>;

  if (!columnIdentifier)
    return (
      <div>Error: Could not determine entity for {field?.label || name}</div>
    );
  if (!datasourceParams)
    return (
      <div>Error: Missing required parameters for {field?.label || name}</div>
    );

  if (!field) {
    console.error(
      `TableDirSelector: 'field' prop is undefined for name: ${name}`,
    );
    return <div>Error: Missing field data for {name}</div>;
  }

  return (
    <Select
      iconLeft={
        <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
      }
      title={field.value || field.label}
      options={options}
      getOptionLabel={(option: Option) => option.title}
      onChange={(event, value) => {
        if (value) {
          onChange(name, value.value);
        }
      }}
    />
  );
};

export default TableDirSelector;

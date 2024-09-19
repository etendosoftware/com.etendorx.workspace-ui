import React, { useEffect, useState, useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import Select from '../../../../ComponentLibrary/src/components/Input/Select';
import SearchOutlined from '../../../../ComponentLibrary/src/assets/icons/search.svg';
import { theme } from '../../../../ComponentLibrary/src/theme';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';

interface TableDirSelectorProps {
  name: string;
  field?: Partial<{
    value: string | number | boolean;
    type: string;
    label: string;
    section: string;
    required: boolean;
  }>;
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

  console.log('TableDirSelector props:', { name, field });

  const {
    windowData,
    columnsData,
    loading: windowLoading,
    error: windowError,
  } = useMetadataContext();

  const fieldMetadata = useMemo(() => {
    return columnsData[windowData.tabs[0].id][name];
  }, [columnsData, name, windowData.tabs]);

  const columnIdentifier = fieldMetadata?.column?._identifier;

  const { records, loading: entityLoading } = useDatasource(windowData.tabs[0]);

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

import React, { useEffect, useState, useMemo } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import Select from '../../../../ComponentLibrary/src/components/Input/Select';
import SearchOutlined from '../../../../ComponentLibrary/src/assets/icons/search.svg';
import { theme } from '../../../../ComponentLibrary/src/theme';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';

interface TableDirSelectorProps {
  name: string;
  field: any;
  onChange: (name: string, value: string) => void;
  windowMetadata: any;
  columnsData: any;
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
  windowMetadata,
  columnsData,
}) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('TableDirSelector props:', {
    name,
    field,
    windowMetadata,
    columnsData,
  });

  const fieldMetadata = useMemo(() => {
    if (
      windowMetadata &&
      windowMetadata.tabs &&
      windowMetadata.tabs.length > 0
    ) {
      const tabId = windowMetadata.tabs[0].id;
      return columnsData[tabId]?.[name];
    }
    return undefined;
  }, [columnsData, name, windowMetadata]);

  console.log('Field metadata:', fieldMetadata);

  const referencedTable = fieldMetadata?.column?.reference;

  console.log('Referenced table:', referencedTable);

  const { records, loading: entityLoading } = useDatasource(
    referencedTable ? { entityName: referencedTable } : null,
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

  if (entityLoading || isLoading) return <Spinner />;

  if (!referencedTable)
    return (
      <div>Error: Could not determine entity for {field?.label || name}</div>
    );

  return (
    <Select
      iconLeft={
        <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
      }
      title={field.value as string}
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

import { useCallback, useMemo, useEffect, useState } from 'react';
import SearchOutlined from '@workspaceui/componentlibrary/src/assets/icons/search.svg';
import { useTheme } from '@mui/material';
import { Option, TableDirSelectorProps } from '../../Form/FormView/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import Select from '@workspaceui/componentlibrary/src/components/Input/Select';
import { useDatasource } from '@/hooks/useDatasource';

const getOptionLabel = (option: Option) => option.title;

const optionEqualValue = (option: Option, value: { id: string }) => option.id === value.id || option.value === value.id;

const TableDirSelector = ({ onChange, entity, value, name, isReadOnly }: TableDirSelectorProps) => {
  const theme = useTheme();
  const { records, loading, error, loaded } = useDatasource({entity});
  const [selectedValue, setSelectedValue] = useState<Option | null>(null);

  const options = useMemo(
    () =>
      records.map(record => ({
        id: record.id as string,
        title: (record._identifier || record.name || record.id) as string,
        value: record.id as string,
      })),
    [records],
  );

  useEffect(() => {
    let option;

    if (value && options.length > 0) {
      option = options.find(opt => {
        if (typeof value === 'object' && 'id' in value) {
          return opt.id === value.id || opt.value === value.id;
        }
        return opt.id === String(value) || opt.value === String(value);
      });
    }

    setSelectedValue(option ?? null);
  }, [value, options]);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event>, newValue: Option | null) => {
      setSelectedValue(newValue);
      if (newValue) {
        onChange(newValue.id);
      }
    },
    [onChange],
  );

  if (loading || !loaded) return <Spinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      options={options}
      onChange={handleChange}
      value={selectedValue}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={optionEqualValue}
      name={name}
      disabled={isReadOnly}
    />
  );
};

export default TableDirSelector;

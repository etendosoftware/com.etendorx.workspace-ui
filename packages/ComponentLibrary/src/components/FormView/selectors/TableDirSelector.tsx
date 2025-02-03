import { useCallback, useMemo, useEffect, useState } from 'react';
import SearchOutlined from '../../../assets/icons/search.svg';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import { useTheme } from '@mui/material';
import { Option, TableDirSelectorProps } from '../types';
import Spinner from '../../Spinner';
import Select from '../../Input/Select';

const getOptionLabel = (option: Option) => option.title;

const optionEqualValue = (option: Option, value: { id: string }) => option.id === value.id || option.value === value.id;

const TableDirSelector = ({ onChange, entity, value, name, disabled, readOnly }: TableDirSelectorProps) => {
  const theme = useTheme();
  const { records, loading, error, loaded } = useDatasource(entity);
  const [selectedValue, setSelectedValue] = useState<Option | null>(null);

  const isDisabled = disabled || readOnly;

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
      disabled={isDisabled}
    />
  );
};

export default TableDirSelector;

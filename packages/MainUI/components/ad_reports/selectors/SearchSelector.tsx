import { useCallback, useMemo, useEffect, useState } from 'react';
import SearchOutlined from '@workspaceui/componentlibrary/src/assets/icons/search.svg';
import { useTheme } from '@mui/material';
import { Option, SearchSelectorProps } from '../../Form/FormView/types';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import Select from '@workspaceui/componentlibrary/src/components/Input/Select';
import { useComboSelect } from '@/hooks/useComboSelect';

const getOptionLabel = (option: Option) => option.title;

const optionEqualValue = (option: Option, value: { id: string }) => option.id === value.id || option.value === value.id;

const SearchSelector = ({ onChange, value, field, name, disabled, readOnly }: SearchSelectorProps) => {
  const theme = useTheme();
  const { records, loading, error } = useComboSelect({ field });
  const [selectedValue, setSelectedValue] = useState<Option | null>(null);

  const isDisabled = disabled || readOnly;

  const options = useMemo(() => {
    const valueField = (field.selector?.valueField ?? '') as string;

    return records.map(record => ({
      id: record[valueField] as string,
      title: (record._identifier || record.name || record.id) as string,
      value: record[valueField] as string,
    }));
  }, [field?.selector?.valueField, records]);

  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => {
        if (typeof value === 'object' && 'id' in value) {
          return opt.id === value.id || opt.value === value.id;
        }
        return opt.id === String(value) || opt.value === String(value);
      });
      if (option) {
        setSelectedValue(option);
      } else {
        setSelectedValue(null);
      }
    } else {
      setSelectedValue(null);
    }
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

  if (loading) return <Spinner />;
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

export default SearchSelector;

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useDatasource } from '@workspaceui/etendohookbinder/hooks/useDatasource';
import Select from '@workspaceui/componentlibrary/components/Input/Select';
import SearchOutlined from '../../../../../ComponentLibrary/src/assets/icons/search.svg';
import { theme } from '@workspaceui/componentlibrary/theme';
import { SearchSelectorProps } from '../types';
import { Option } from '@workspaceui/componentlibrary/components/Input/Select/types';

function SearchSelector({ onChange, label, entity, value }: SearchSelectorProps) {
  const { records } = useDatasource(entity);
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
        onChange(label, newValue.id);
      }
    },
    [label, onChange],
  );

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      options={options}
      onChange={handleChange}
      value={selectedValue}
      getOptionLabel={(option: Option) => option.title}
      isOptionEqualToValue={(option, value) => option.id === value.id || option.value === value.id}
    />
  );
}

export default SearchSelector;

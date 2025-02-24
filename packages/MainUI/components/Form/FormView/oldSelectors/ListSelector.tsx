import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Select from '@workspaceui/componentlibrary/src/components/Input/Select';
import SearchOutlined from '@workspaceui/componentlibrary/src/assets/icons/search.svg';
import { Option } from '@workspaceui/componentlibrary/src/components/Input/Select/types';
import { ListSelectorProps } from '../types';
import { useTheme } from '@mui/material';

const ListSelector: React.FC<ListSelectorProps> = ({ field, value, onChange, readOnly }) => {
  const [selectedValue, setSelectedValue] = useState<Option | null>(() => {
    if (field.refList) {
      const option = field.refList.find(item => item.value === value);

      if (option) {
        return {
          id: option.id,
          title: option.label,
          value: option.value,
        };
      }
    }

    return null;
  });
  const theme = useTheme();

  const options: Option[] = useMemo(() => {
    if (field.refList) {
      return field.refList.map(item => ({
        id: item.id,
        title: item.label,
        value: item.value,
      }));
    }
    return [];
  }, [field.refList]);

  useEffect(() => {
    setSelectedValue(options.find(option => option.value === value) || null);
  }, [value, options]);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event>, newValue: Option | null) => {
      if (newValue) {
        setSelectedValue(newValue);
        onChange(newValue.value);
      }
    },
    [onChange],
  );

  const isOptionEqualToValue = useCallback((option: Option, value: Option) => option.value === value.value, []);

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      options={options}
      onChange={handleChange}
      value={selectedValue}
      isOptionEqualToValue={isOptionEqualToValue}
      disabled={readOnly}
    />
  );
};

export default ListSelector;

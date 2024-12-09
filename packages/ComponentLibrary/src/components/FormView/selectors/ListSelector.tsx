import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Select from '../../Input/Select';
import SearchOutlined from '../../../assets/icons/search.svg';
import { Option } from '../../Input/Select/types';
import { ListSelectorProps } from '../types';
import { useTheme } from '@mui/material';

const ListSelector: React.FC<ListSelectorProps> = ({ field, value, onChange, readOnly }) => {
  const [selectedValue, setSelectedValue] = useState<Option | null>(() => {
    if (field.original?.refList) {
      const option = field.original.refList.find(item => item.value === value);

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
    if (field.original?.refList) {
      return field.original.refList.map((item: { id: string; label: string; value: string }) => ({
        id: item.id,
        title: item.label,
        value: item.value,
      }));
    }
    return [];
  }, [field.original?.refList]);

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

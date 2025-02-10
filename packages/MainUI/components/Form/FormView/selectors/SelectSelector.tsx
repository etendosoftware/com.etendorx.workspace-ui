import { memo, useCallback, useMemo } from 'react';
import Select from '@workspaceui/componentlibrary/src/components/Input/Select';
import SearchOutlined from '@workspaceui/componentlibrary/src/assets/icons/search.svg';
import { SelectSelectorProps } from '../types';
import { useTheme } from '@mui/material';
import { Option } from '@workspaceui/etendohookbinder/src/api/types';

const SelectSelector = memo(({ value, name, title, onChange, readOnly, field }: SelectSelectorProps) => {
  const theme = useTheme();
  const options = useMemo<Option[]>(
    () =>
      field.refList.map(v => ({
        id: v.id,
        title: v.label,
        value: v.value,
      })),
    [field.refList],
  );
  const handleChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, newValue: Option<string> | null) => {
      onChange(newValue?.value || '');
    },
    [onChange],
  );
  const current = useMemo(() => options.find(opt => opt.value === value), [options, value]);

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      title={title}
      options={options}
      getOptionLabel={option => option.title}
      onChange={handleChange}
      disabled={readOnly}
      name={name}
      value={current}
    />
  );
});
export default SelectSelector;

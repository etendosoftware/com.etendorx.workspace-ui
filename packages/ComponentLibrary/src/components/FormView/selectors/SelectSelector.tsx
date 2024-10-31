import { memo, useCallback, useMemo } from 'react';
import Select from '@workspaceui/componentlibrary/components/Input/Select';
import SearchOutlined from '@workspaceui/componentlibrary/assets/icons/search.svg';
import { SelectSelectorProps } from '../types';
import { useTheme } from '@mui/material';
import { Option } from 'src/components/Input/Select/types';

const SelectSelector = memo(({ name, title, onChange, readOnly }: SelectSelectorProps) => {
  const theme = useTheme();
  const options = useMemo(() => [], []);
  const handleChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, newValue: Option<string> | null) => onChange(name, newValue?.value || ''),
    [name, onChange],
  );

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      title={title}
      options={options}
      getOptionLabel={option => option.title}
      onChange={handleChange}
      disabled={readOnly}
    />
  );
});

export default SelectSelector;

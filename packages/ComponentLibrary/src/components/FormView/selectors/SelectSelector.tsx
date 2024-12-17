import { memo, useCallback, useMemo } from 'react';
import Select from '../../Input/Select';
import SearchOutlined from '../../../assets/icons/search.svg';
import { SelectSelectorProps } from '../types';
import { useTheme } from '@mui/material';
import { Option } from '../../Input/Select/types';

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

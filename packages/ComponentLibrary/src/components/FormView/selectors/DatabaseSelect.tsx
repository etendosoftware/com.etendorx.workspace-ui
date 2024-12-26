import { memo, useMemo } from 'react';
import Select from '../../Input/Select';
import SearchOutlined from '../../../assets/icons/search.svg';
import type { DatabaseSelectSelector } from '../types';
import { useTheme } from '@mui/material';
import { Option } from '@workspaceui/etendohookbinder/src/api/types';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';

const DatabaseSelectSelector = memo(({ value, name, title, onChange, readOnly, entity }: DatabaseSelectSelector) => {
  const theme = useTheme();

  const { records = [], loading } = useDatasource(entity);

  const options = useMemo<Option<string>[]>(
    () =>
      records.map(record => ({
        id: String(record.id || ''),
        title: String(record._identifier || record.name || ''),
        value: String(record.id || ''),
      })),
    [records],
  );

  const currentValue = useMemo(() => options.find(opt => opt.value === value) || null, [options, value]);

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      title={title}
      options={options}
      getOptionLabel={option => option.title}
      onChange={(_event, newValue) => onChange(newValue?.value || '')}
      disabled={readOnly || loading}
      name={name}
      value={currentValue}
    />
  );
});

export default DatabaseSelectSelector;

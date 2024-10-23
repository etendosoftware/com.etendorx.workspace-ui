import React, { memo } from 'react';
import Select from '@workspaceui/componentlibrary/components/Input/Select';
import SearchOutlined from '../../../../../ComponentLibrary/src/assets/icons/search.svg';
import { theme } from '@workspaceui/componentlibrary/components';
import { topFilms } from '../../../../../storybook/src/stories/Components/Input/Select/mock';
import { SelectSelectorProps } from '../types';

const SelectSelector: React.FC<SelectSelectorProps> = memo(({ name, title, onChange, readOnly }) => (
  <Select
    iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
    title={title}
    options={topFilms}
    getOptionLabel={option => option.title}
    onChange={(_, newValue) => onChange(name, newValue?.value || '')}
    disabled={readOnly}
  />
));

export default SelectSelector;

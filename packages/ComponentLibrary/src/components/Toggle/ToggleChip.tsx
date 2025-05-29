import type React from 'react';
import Switch from '@mui/material/Switch';
import { useStyle } from './styles';
import type { ToggleChipProps } from './types';

const ToggleChip: React.FC<ToggleChipProps> = ({ isActive, onToggle }) => {
  const { sx } = useStyle();

  return <Switch checked={isActive} onChange={onToggle} sx={sx.switch} />;
};

export default ToggleChip;

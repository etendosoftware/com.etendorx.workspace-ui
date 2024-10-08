import React from 'react';
import Switch from '@mui/material/Switch';
import { styled, Theme } from '@mui/material/styles';
import switchStyles from './Toggle.styles';
import { ToggleChipProps } from './types';

const StyledSwitch = styled(Switch)(({ theme }: { theme: Theme }) =>
  switchStyles(theme),
);

const ToggleChip: React.FC<ToggleChipProps> = ({ isActive, onToggle }) => (
  <StyledSwitch checked={isActive} onChange={onToggle} />
);

export default ToggleChip;

import React from 'react';
import Switch, { SwitchProps } from '@mui/material/Switch';
import { styled, Theme } from '@mui/material/styles';
import switchStyles from './Toggle.styles';

const StyledSwitch = styled(Switch)(({ theme }: { theme: Theme }) =>
  switchStyles(theme),
);

interface ToggleChipProps extends SwitchProps {}

const ToggleChip: React.FC<ToggleChipProps> = props => (
  <StyledSwitch {...props} />
);

export default ToggleChip;

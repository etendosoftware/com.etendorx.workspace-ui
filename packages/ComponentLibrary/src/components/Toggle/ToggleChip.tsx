import React from 'react';
import Switch, { SwitchProps } from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled, Theme } from '@mui/material/styles';
import { switchStyles, formControlLabelStyles } from './toggle.styles';

const StyledSwitch = styled(Switch)(({ theme }: { theme: Theme }) =>
  switchStyles(theme),
);

interface ToggleChipProps extends SwitchProps {}

const ToggleChip: React.FC<ToggleChipProps> = props => (
  <FormControlLabel
    control={<StyledSwitch {...props} />}
    label=""
    style={formControlLabelStyles}
  />
);

export default ToggleChip;

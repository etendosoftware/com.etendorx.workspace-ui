import React, { useState } from 'react';
import { Box, Grid } from '@mui/material';
import ToggleChip from '../../../../../ComponentLibrary/src/components/Toggle/ToggleChip';

export default {
  title: 'Components/ToggleChip',
  component: ToggleChip,
  argTypes: {
    isActive: { control: 'boolean' },
    onToggle: { action: 'toggled' },
  },
};

const Template = args => {
  const [isActive, setIsActive] = useState(args.isActive);

  const handleToggle = () => {
    setIsActive(!isActive);
    args.onToggle();
  };

  React.useEffect(() => {
    setIsActive(args.isActive);
  }, [args.isActive]);

  return (
    <Grid container spacing={2}>
      <Box sx={{ margin: '5rem' }}>
        <ToggleChip isActive={isActive} onToggle={handleToggle} />
      </Box>
    </Grid>
  );
};

export const Variants = Template.bind({});
Variants.args = {
  isActive: false,
};

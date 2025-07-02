import type React from 'react';
import { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import ToggleChip from '@workspaceui/componentlibrary/src/components/Toggle/ToggleChip';
import type { Meta, StoryObj } from '@storybook/react';

interface ToggleChipProps {
  isActive: boolean;
  onToggle: () => void;
}

const meta: Meta<typeof ToggleChip> = {
  title: 'Components/ToggleChip',
  component: ToggleChip,
  argTypes: {
    isActive: { control: 'boolean' },
    onToggle: { action: 'toggled' },
  },
};

export default meta;

type Story = StoryObj<ToggleChipProps>;

const ToggleChipTemplate: React.FC<ToggleChipProps> = (args) => {
  const [isActive, setIsActive] = useState(args.isActive);

  const handleToggle = () => {
    setIsActive(!isActive);
    args.onToggle();
  };

  useEffect(() => {
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

export const Variants: Story = {
  render: (args) => <ToggleChipTemplate {...args} />,
  args: {
    isActive: false,
    onToggle: () => console.log('Toggled'),
  },
};

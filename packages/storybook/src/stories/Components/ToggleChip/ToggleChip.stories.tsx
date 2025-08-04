/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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

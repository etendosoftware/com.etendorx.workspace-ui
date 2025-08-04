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
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import NotificationIcon from '@workspaceui/componentlibrary/src/assets/icons/heart.svg';
import type { Meta, StoryObj } from '@storybook/react';
import { useTheme } from '@mui/material';
import type { IIconComponentProps } from '@workspaceui/componentlibrary/src/components/IconButton/types';

interface IconButtonWrapperProps {
  args: IIconComponentProps;
}

const IconButtonWrapper: React.FC<IconButtonWrapperProps> = ({ args }) => {
  const theme = useTheme();

  const baseStyles = {
    borderRadius: '6.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    background: theme.palette.baselineColor.neutral[0],
    '&:hover': {
      backgroundColor: theme.palette.dynamicColor.main,
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...args.sx,
  };

  return <IconButton {...args} sx={combinedStyles} />;
};

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  argTypes: {
    tooltip: { control: 'text' },
    fill: { control: 'color' },
    hoverFill: { control: 'color' },
    iconText: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  render: (args) => <IconButtonWrapper args={args} />,
  args: {
    tooltip: 'Default IconButton',
    children: <NotificationIcon />,
  },
};

export const CustomFill: Story = {
  render: (args) => <IconButtonWrapper args={args} />,
  args: {
    tooltip: 'Custom Fill IconButton',
    children: <NotificationIcon />,
    fill: '#1976d2',
    hoverFill: '#fff',
    sx: {
      '&:hover': {
        backgroundColor: '#1976d2',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => <IconButtonWrapper args={args} />,
  args: {
    tooltip: 'Disabled IconButton',
    children: <NotificationIcon />,
    disabled: true,
  },
};

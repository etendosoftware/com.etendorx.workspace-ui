import IconButton from '../../../../../ComponentLibrary/src/components/IconButton';
import NotificationIcon from '../../../../../ComponentLibrary/src/assets/icons/heart.svg';
import type { Meta, StoryObj } from '@storybook/react';
import { theme } from '../../../../../ComponentLibrary/src/theme';
import { sx } from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.styles';

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  argTypes: {
    tooltip: { control: 'text' },
    fill: { control: 'color' },
    hoverFill: { control: 'color' },
  },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: {
    tooltip: 'Default IconButton',
    children: <NotificationIcon />,
    sx: sx.hoverStyles,
  },
};

export const CustomFill: Story = {
  args: {
    tooltip: 'Custom Fill IconButton',
    fill: theme.palette.primary.main,
    children: <NotificationIcon />,
    sx: sx.hoverStyles,
  },
};

export const HoverFill: Story = {
  args: {
    tooltip: 'Hover Fill IconButton',
    fill: theme.palette.baselineColor.neutral[80],
    hoverFill: theme.palette.baselineColor.neutral[0],
    children: <NotificationIcon />,
    sx: sx.hoverStyles,
  },
};

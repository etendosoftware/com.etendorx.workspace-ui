import IconButton from '../../../../../ComponentLibrary/src/components/IconButton';
import NotificationIcon from '../../../../../ComponentLibrary/src/assets/icons/heart.svg';
import type { Meta, StoryObj } from '@storybook/react';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { useStyle } from '../../../../../ComponentLibrary/src/components/Waterfall/styles';

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

const getStyles = () => {
  const { sx } = useStyle();
  return {
    defaultStyles: {
      ...sx.customizeButton,
      '&:hover': {
        backgroundColor: theme.palette.dynamicColor.contrastText,
        color: theme.palette.baselineColor.neutral[80],
      },
    },
  };
};

export const Default: Story = {
  args: {
    tooltip: 'Default IconButton',
    children: <NotificationIcon />,
    sx: getStyles().defaultStyles,
  },
};

export const CustomFill: Story = {
  args: {
    tooltip: 'Custom Fill IconButton',
    fill: theme.palette.primary.main,
    children: <NotificationIcon />,
    sx: {
      ...getStyles().defaultStyles,
      color: theme.palette.primary.main,
    },
  },
};

export const HoverFill: Story = {
  args: {
    tooltip: 'Hover Fill IconButton',
    fill: theme.palette.baselineColor.neutral[80],
    hoverFill: theme.palette.baselineColor.neutral[0],
    children: <NotificationIcon />,
    sx: {
      ...getStyles().defaultStyles,
      color: theme.palette.baselineColor.neutral[80],
      '&:hover': {
        backgroundColor: theme.palette.baselineColor.neutral[80],
        color: theme.palette.baselineColor.neutral[0],
      },
    },
  },
};

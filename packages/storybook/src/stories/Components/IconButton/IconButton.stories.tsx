import IconButton from '../../../../../ComponentLibrary/src/components/IconButton';
import NotificationIcon from '../../../../../ComponentLibrary/src/assets/icons/heart.svg';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { theme } from '../../../../../ComponentLibrary/src/theme';
import { sx } from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.styles';

export default {
  title: 'Components/IconButton',
  component: IconButton,
} as ComponentMeta<typeof IconButton>;

const Template: ComponentStory<typeof IconButton> = args => (
  <IconButton {...args} />
);

export const Default = Template.bind({});
Default.args = {
  tooltip: 'Default IconButton',
  children: <NotificationIcon />,
  sx: sx.hoverStyles,
};

export const CustomFill = Template.bind({});
CustomFill.args = {
  tooltip: 'Custom Fill IconButton',
  fill: theme.palette.primary.main,
  children: <NotificationIcon />,
  sx: sx.hoverStyles,
};

export const HoverFill = Template.bind({});
HoverFill.args = {
  tooltip: 'Hover Fill IconButton',
  fill: theme.palette.baselineColor.neutral[80],
  hoverFill: theme.palette.baselineColor.neutral[0],
  children: <NotificationIcon />,
  sx: sx.hoverStyles,
};

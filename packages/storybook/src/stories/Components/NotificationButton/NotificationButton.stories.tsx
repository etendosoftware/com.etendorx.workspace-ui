import { ReactElement } from 'react';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import NotificationIcon from '../../../../../ComponentLibrary/public/icons/bell.svg';
import type { Meta, StoryObj } from '@storybook/react';
import { Inotifications } from '../../../../../ComponentLibrary/src/commons';

interface NotificationButtonProps {
  notifications: Inotifications[];
  tooltipTitle: string;
  icon: ReactElement;
}

const meta: Meta<typeof NotificationButton> = {
  title: 'Components/NotificationButton',
  component: NotificationButton,
  argTypes: {
    tooltipTitle: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<NotificationButtonProps>;

const generateMockNotifications = (count: number): Inotifications[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
    description: `Notification ${index + 1}`,
    date: new Date().toLocaleString(),
    icon: NotificationIcon,
  }));

export const NotificationButtonDefault: Story = {
  render: args => <NotificationButton {...args} />,
  args: {
    notifications: [],
    tooltipTitle: 'Empty Notifications',
    icon: <NotificationIcon />,
  },
};

export const NotificationButtonSome: Story = {
  render: args => <NotificationButton {...args} />,
  args: {
    notifications: generateMockNotifications(5),
    tooltipTitle: 'Notifications',
    icon: <NotificationIcon />,
  },
};

export const NotificationButtonMany: Story = {
  render: args => <NotificationButton {...args} />,
  args: {
    notifications: generateMockNotifications(100),
    tooltipTitle: 'Many Notifications',
    icon: <NotificationIcon />,
  },
};

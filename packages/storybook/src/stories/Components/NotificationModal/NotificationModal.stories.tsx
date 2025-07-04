import type React from 'react';
import NotificationModal from '@workspaceui/componentlibrary/src/components/NotificationsModal';
import NotificationButton from '@workspaceui/componentlibrary/src/components/NotificationsButton';
import { NOTIFICATIONS } from '../notifications.mock';
import NotificationIcon from '@workspaceui/componentlibrary/src/assets/icons/bell.svg';
import type { Meta, StoryObj } from '@storybook/react';
import type { Inotifications } from '@workspaceui/componentlibrary/src/commons';

interface NotificationModalProps {
  notifications: Inotifications[];
  icon: React.ReactElement;
  linkTitle: { label: string; url: string };
  emptyStateImageAlt: string;
  emptyStateMessage: string;
  emptyStateDescription: string;
  actionButtonLabel: string;
}

const meta: Meta<typeof NotificationButton> = {
  title: 'Components/NotificationModal',
  component: NotificationButton,
  argTypes: {},
};

export default meta;

type Story = StoryObj<NotificationModalProps>;

const NotificationModalTemplate: React.FC<NotificationModalProps> = (args) => (
  <NotificationButton notifications={args.notifications} icon={args.icon}>
    <NotificationModal
      notifications={args.notifications}
      title={{
        icon: args.icon,
        label: 'Notifications',
      }}
      linkTitle={args.linkTitle}
      emptyStateImageAlt={args.emptyStateImageAlt}
      emptyStateMessage={args.emptyStateMessage}
      emptyStateDescription={args.emptyStateDescription}
      actionButtonLabel={args.actionButtonLabel}
    />
  </NotificationButton>
);

export const NotificationModalDefault: Story = {
  render: (args) => <NotificationModalTemplate {...args} />,
  args: {
    notifications: NOTIFICATIONS,
    icon: <NotificationIcon fill='#2E365C' />,
    linkTitle: { label: 'Mark all as read', url: '/home' },
    emptyStateImageAlt: 'No Notifications',
    emptyStateMessage: 'You have no notifications',
    emptyStateDescription:
      'Great! You are up to date with everything. We will notify you here if there is anything new.',
    actionButtonLabel: 'Configure notifications',
  },
};

export const NotificationModalEmpty: Story = {
  render: (args) => <NotificationModalTemplate {...args} />,
  args: {
    notifications: [],
    icon: <NotificationIcon fill='#2E365C' />,
    linkTitle: { label: 'Mark all as read', url: '/home' },
    emptyStateImageAlt: 'No Notifications',
    emptyStateMessage: 'You have no notifications',
    emptyStateDescription:
      'Great! You are up to date with everything. We will notify you here if there is anything new.',
    actionButtonLabel: 'Configure notifications',
  },
};

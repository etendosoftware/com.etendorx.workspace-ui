import NotificationModal from '../../../../../ComponentLibrary/src/components/NotificationsModal';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import { NOTIFICATIONS } from '../notifications.mock';
import NotificationIcon from '../../../../../ComponentLibrary/src/assets/icons/bell.svg';

export default {
  title: 'Components/NotificationModal',
  component: NotificationButton,
  argTypes: {
    notifications: { control: 'array' },
    title: { control: 'object' },
    linkTitle: { control: 'object' },
    emptyStateImageAlt: { control: 'text' },
    emptyStateMessage: { control: 'text' },
    emptyStateDescription: { control: 'text' },
    actionButtonLabel: { control: 'text' },
  },
};

const Template = args => (
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

export const NotificationModalDefault = Template.bind({});
NotificationModalDefault.args = {
  notifications: NOTIFICATIONS,
  icon: <NotificationIcon fill="#2E365C" />,
  linkTitle: { label: 'Mark all as read', url: '/home' },
  emptyStateImageAlt: 'No Notifications',
  emptyStateMessage: 'You have no notifications',
  emptyStateDescription:
    'Great! You are up to date with everything. We will notify you here if there is anything new.',
  actionButtonLabel: 'Configure notifications',
};

export const NotificationModalEmpty = Template.bind({});
NotificationModalEmpty.args = {
  notifications: [],
  icon: <NotificationIcon fill="#2E365C" />,
  linkTitle: { label: 'Mark all as read', url: '/home' },
  emptyStateImageAlt: 'No Notifications',
  emptyStateMessage: 'You have no notifications',
  emptyStateDescription:
    'Great! You are up to date with everything. We will notify you here if there is anything new.',
  actionButtonLabel: 'Configure notifications',
};

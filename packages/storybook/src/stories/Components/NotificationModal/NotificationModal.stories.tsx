import NotificationModal from '../../../../../ComponentLibrary/src/components/NotificationsModal';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import { NOTIFICATIONS } from '../notifications.mock';
import logo from '../../../../../MainUI/src/assets/react.svg';

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
  <NotificationButton notifications={args.notifications}>
    <NotificationModal
      title={{ icon: logo, label: 'Notifications' }}
      linkTitle={{ label: 'Mark all as read', url: '/home' }}
      emptyStateImageAlt="No Notifications"
      emptyStateMessage="You have no notifications"
      emptyStateDescription="Great! You are up to date with everything. We will notify you here if there is anything new."
      actionButtonLabel="Configure notifications"
    />
  </NotificationButton>
);

export const NotificationModalDefault = Template.bind({});
NotificationModalDefault.args = {
  notifications: NOTIFICATIONS,
};

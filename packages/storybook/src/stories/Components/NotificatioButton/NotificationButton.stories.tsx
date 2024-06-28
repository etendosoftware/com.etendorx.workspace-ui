import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import { NOTIFICATIONS } from '../notifications.mock';

export default {
  title: 'Components/NotificationButton',
  component: NotificationButton,
  argTypes: {
    tooltipTitle: { control: 'text' },
  },
};

const Template = args => <NotificationButton {...args} />;

export const Default = Template.bind({});
Default.args = {
  notifications: NOTIFICATIONS,
  tooltipTitle: 'Notificaciones',
};

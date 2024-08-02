import { Grid } from '@mui/material';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import { NotificationsOutlined } from '@mui/icons-material';
import { ExtendedNotificationButtonProps } from '../../../../../ComponentLibrary/src/components/NotificationsButton/types';

const NotificationButtonDef = {
  title: 'Components/NotificationButton',
  component: NotificationButton,
  argTypes: {
    tooltipTitle: { control: 'text' },
  },
};

export default NotificationButtonDef;

const generateMockNotifications = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
    description: `${index + 1} notification`,
    date: new Date().toLocaleString(),
    icon: NotificationsOutlined,
  }));

const Template = (args: ExtendedNotificationButtonProps) => (
  <Grid container spacing={6}>
    <Grid item xs={1}>
      <NotificationButton
        {...args}
        notifications={generateMockNotifications(100)}
      />
    </Grid>
    <Grid item xs={1}>
      <NotificationButton
        {...args}
        notifications={generateMockNotifications(99)}
      />
    </Grid>
    <Grid item xs={1}>
      <NotificationButton
        {...args}
        notifications={generateMockNotifications(7)}
      />
    </Grid>
    <Grid item xs={1}>
      <NotificationButton {...args} notifications={[]} />
    </Grid>
  </Grid>
);

export const NotificationButtonDefault = Template.bind({});
// @ts-expect-error - Required by storybook
NotificationButtonDefault.args = {
  tooltipTitle: 'Notificaciones',
};

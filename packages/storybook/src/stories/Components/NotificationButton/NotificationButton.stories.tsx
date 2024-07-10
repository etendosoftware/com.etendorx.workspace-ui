import Grid from '@mui/material/Grid';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';

export default {
  title: 'Components/NotificationButton',
  component: NotificationButton,
  argTypes: {
    tooltipTitle: { control: 'text' },
  },
};

// Mock de notificaciones extendido
const generateMockNotifications = count => {
  return Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
  }));
};

const Template = args => (
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
NotificationButtonDefault.args = {
  tooltipTitle: 'Notificaciones',
};

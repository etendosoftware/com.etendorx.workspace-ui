import NotificationItemStates from '../../../../../ComponentLibrary/src/components/NotificationItemAllStates';
import { notificationsStates } from './NotificationItemStates.mock';
import { Grid } from '@mui/material';

export default {
  title: 'Components/NotificationItemStates',
  component: NotificationItemStates,
  argTypes: {
    notifications: { control: 'array' },
    type: { control: 'text' },
  },
};

const Template = args => <NotificationItemStates {...args} />;

export const Informatives = Template.bind({});
Informatives.args = {
  notifications: notificationsStates,
  type: 'informatives',
};

export const WithButtons = Template.bind({});
WithButtons.args = {
  notifications: notificationsStates,
  type: 'withButtons',
};

export const WithButtonsAndTags = Template.bind({});
WithButtonsAndTags.args = {
  notifications: notificationsStates,
  type: 'withButtonsAndTags',
};

export const Tags = Template.bind({});
Tags.args = {
  notifications: notificationsStates,
  type: 'tags',
};

export const Avatar = Template.bind({});
Avatar.args = {
  notifications: notificationsStates,
  type: 'avatar',
};

const GridTemplate = args => (
  <Grid container spacing={1}>
    <Grid item>
      <NotificationItemStates {...args} type="informatives" />
    </Grid>
    <Grid item>
      <NotificationItemStates {...args} type="withButtons" />
    </Grid>
    <Grid item>
      <NotificationItemStates {...args} type="withButtonsAndTags" />
    </Grid>
    <Grid item>
      <NotificationItemStates {...args} type="tags" />
    </Grid>
    <Grid item>
      <NotificationItemStates {...args} type="avatar" />
    </Grid>
  </Grid>
);

export const GridNotifications = GridTemplate.bind({});
GridNotifications.args = {
  notifications: notificationsStates,
};

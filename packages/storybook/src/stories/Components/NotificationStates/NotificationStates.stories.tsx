import type React from 'react';
import NotificationItemStates from '@workspaceui/componentlibrary/src/components/NotificationItemAllStates';
import { createNotificationStates } from './NotificationItemStates.mock';
import { Grid, useTheme } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import type { IallNotifications } from '@workspaceui/componentlibrary/src/components/NotificationItemAllStates/types';

interface NotificationItemStatesProps {
  notifications: IallNotifications[];
  type: 'informatives' | 'withButtons' | 'withButtonsAndTags' | 'tags' | 'avatar';
}

const meta: Meta<typeof NotificationItemStates> = {
  title: 'Components/NotificationItemStates',
  component: NotificationItemStates,
  argTypes: {
    notifications: { control: undefined },
    type: {
      control: 'select',
      options: ['informatives', 'withButtons', 'withButtonsAndTags', 'tags', 'avatar'],
    },
  },
};

export default meta;

type Story = StoryObj<NotificationItemStatesProps>;

const NotificationItemStatesTemplate: React.FC<NotificationItemStatesProps> = (args) => {
  const theme = useTheme();
  const notifications = createNotificationStates(theme);

  return <NotificationItemStates {...args} notifications={notifications} />;
};

export const Informatives: Story = {
  render: () => <NotificationItemStatesTemplate type='informatives' notifications={[]} />,
};

export const WithButtons: Story = {
  render: () => <NotificationItemStatesTemplate type='withButtons' notifications={[]} />,
};

export const WithButtonsAndTags: Story = {
  render: () => <NotificationItemStatesTemplate type='withButtonsAndTags' notifications={[]} />,
};

export const Tags: Story = {
  render: () => <NotificationItemStatesTemplate type='tags' notifications={[]} />,
};

export const Avatar: Story = {
  render: () => <NotificationItemStatesTemplate type='avatar' notifications={[]} />,
};

const GridTemplate: React.FC = () => {
  const theme = useTheme();
  const notifications = createNotificationStates(theme);

  return (
    <Grid container spacing={1}>
      <Grid item>
        <NotificationItemStates notifications={notifications} type='informatives' />
      </Grid>
      <Grid item>
        <NotificationItemStates notifications={notifications} type='withButtons' />
      </Grid>
      <Grid item>
        <NotificationItemStates notifications={notifications} type='withButtonsAndTags' />
      </Grid>
      <Grid item>
        <NotificationItemStates notifications={notifications} type='tags' />
      </Grid>
      <Grid item>
        <NotificationItemStates notifications={notifications} type='avatar' />
      </Grid>
    </Grid>
  );
};

export const GridNotifications: Story = {
  render: () => <GridTemplate />,
};

import React from 'react';
import NotificationItemStates from '../../../../../ComponentLibrary/src/components/NotificationItemAllStates';
import { notificationsStates } from './NotificationItemStates.mock';
import { Grid } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react';
import { IallNotifications } from '../../../../../ComponentLibrary/src/components/NotificationItemAllStates/types';

interface NotificationItemStatesProps {
  notifications: IallNotifications[];
  type:
    | 'informatives'
    | 'withButtons'
    | 'withButtonsAndTags'
    | 'tags'
    | 'avatar';
}

const meta: Meta<typeof NotificationItemStates> = {
  title: 'Components/NotificationItemStates',
  component: NotificationItemStates,
  argTypes: {
    notifications: { control: undefined },
    type: {
      control: 'select',
      options: [
        'informatives',
        'withButtons',
        'withButtonsAndTags',
        'tags',
        'avatar',
      ],
    },
  },
};

export default meta;

type Story = StoryObj<NotificationItemStatesProps>;

const NotificationItemStatesTemplate: React.FC<
  NotificationItemStatesProps
> = args => <NotificationItemStates {...args} />;

export const Informatives: Story = {
  render: args => <NotificationItemStatesTemplate {...args} />,
  args: {
    notifications: notificationsStates,
    type: 'informatives',
  },
};

export const WithButtons: Story = {
  render: args => <NotificationItemStatesTemplate {...args} />,
  args: {
    notifications: notificationsStates,
    type: 'withButtons',
  },
};

export const WithButtonsAndTags: Story = {
  render: args => <NotificationItemStatesTemplate {...args} />,
  args: {
    notifications: notificationsStates,
    type: 'withButtonsAndTags',
  },
};

export const Tags: Story = {
  render: args => <NotificationItemStatesTemplate {...args} />,
  args: {
    notifications: notificationsStates,
    type: 'tags',
  },
};

export const Avatar: Story = {
  render: args => <NotificationItemStatesTemplate {...args} />,
  args: {
    notifications: notificationsStates,
    type: 'avatar',
  },
};

const GridTemplate: React.FC<NotificationItemStatesProps> = args => (
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

export const GridNotifications: Story = {
  render: args => <GridTemplate {...args} />,
  args: {
    notifications: notificationsStates,
    type: 'informatives',
  },
};

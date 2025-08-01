/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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

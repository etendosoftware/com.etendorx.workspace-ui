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

import type { ReactElement } from 'react';
import NotificationButton from '@workspaceui/componentlibrary/src/components/NotificationsButton';
import NotificationIcon from '@workspaceui/componentlibrary/src/assets/icons/bell.svg';
import type { Meta, StoryObj } from '@storybook/react';
import type { Inotifications } from '@workspaceui/componentlibrary/src/commons';

interface NotificationButtonProps {
  notifications: Inotifications[];
  tooltipTitle: string;
  icon: ReactElement;
}

const meta: Meta<typeof NotificationButton> = {
  title: 'Components/NotificationButton',
  component: NotificationButton,
  argTypes: {
    tooltipTitle: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<NotificationButtonProps>;

const generateMockNotifications = (count: number): Inotifications[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${index + 1}`,
    description: `Notification ${index + 1}`,
    date: new Date().toLocaleString(),
    icon: NotificationIcon,
  }));

export const NotificationButtonDefault: Story = {
  render: (args) => <NotificationButton {...args} />,
  args: {
    notifications: [],
    tooltipTitle: 'Empty Notifications',
    icon: <NotificationIcon />,
  },
};

export const NotificationButtonSome: Story = {
  render: (args) => <NotificationButton {...args} />,
  args: {
    notifications: generateMockNotifications(5),
    tooltipTitle: 'Notifications',
    icon: <NotificationIcon />,
  },
};

export const NotificationButtonMany: Story = {
  render: (args) => <NotificationButton {...args} />,
  args: {
    notifications: generateMockNotifications(100),
    tooltipTitle: 'Many Notifications',
    icon: <NotificationIcon />,
  },
};

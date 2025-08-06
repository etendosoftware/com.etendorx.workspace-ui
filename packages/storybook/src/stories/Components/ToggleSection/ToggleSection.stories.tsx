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

import SelectorList from '@workspaceui/componentlibrary/src/components/ProfileModal/ToggleSection';
import type { SelectorListProps } from '@workspaceui/componentlibrary/src/components/ProfileModal/types';
import type { Meta, StoryObj } from '@storybook/react';
import { mockRoles } from './mock';

const meta: Meta<typeof SelectorList> = {
  title: 'Components/Sections',
  component: SelectorList,
  argTypes: {
    section: {
      control: 'radio',
      options: ['password', 'profile'],
    },
    passwordLabel: { control: 'text' },
    newPasswordLabel: { control: 'text' },
    confirmPasswordLabel: { control: 'text' },
    onRoleChange: { action: 'role changed' },
    onWarehouseChange: { action: 'warehouse changed' },
    onSaveAsDefaultChange: { action: 'save as default changed' },
  },
};

export default meta;

type Story = StoryObj<SelectorListProps>;

export const PasswordSection: Story = {
  args: {
    section: 'password',
    passwordLabel: 'Current Password',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
  },
};

export const ProfileSection: Story = {
  args: {
    section: 'profile',
    roles: mockRoles,
    selectedRole: { id: '1', value: '1', title: 'Admin' },
    selectedWarehouse: { id: 'wh1', value: 'wh1', title: 'Warehouse 1' },
    saveAsDefault: false,
  },
};

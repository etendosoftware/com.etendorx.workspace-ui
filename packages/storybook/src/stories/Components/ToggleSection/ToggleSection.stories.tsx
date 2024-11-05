import SelectorList from '@workspaceui/componentlibrary/src/components/ProfileModal/ToggleSection';
import { SelectorListProps } from '@workspaceui/componentlibrary/src/components/ProfileModal/types';
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

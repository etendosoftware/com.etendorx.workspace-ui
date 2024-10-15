import SelectorList from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleSection';
import { SelectorListProps } from '../../../../../ComponentLibrary/src/components/ProfileModal/types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SelectorList> = {
  title: 'Components/Sections',
  component: SelectorList,
  argTypes: {
    section: { control: 'text' },
    passwordLabel: { control: 'text' },
    newPasswordLabel: { control: 'text' },
    confirmPasswordLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<SelectorListProps>;

export const PasswordSection: Story = {
  render: args => <SelectorList {...args} />,
  args: {
    section: 'password',
    passwordLabel: 'Password',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
  },
};

export const ProfileSection: Story = {
  render: args => <SelectorList {...args} />,
  args: {
    section: 'profile',
    passwordLabel: '',
    newPasswordLabel: '',
    confirmPasswordLabel: '',
  },
};

import React from 'react';
import ProfileModal from '../../../../../ComponentLibrary/src/components/ProfileModal/ProfileModal';
import profilePicture from '../.././../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';
import PersonIcon from '../../../../../ComponentLibrary/src/assets/icons/user.svg';
import { sections } from './mock';
import type { Meta, StoryObj } from '@storybook/react';
import { Section } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton/types';

interface ProfileModalProps {
  cancelButtonText: string;
  saveButtonText: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  section: string;
  tooltipButtonProfile: string;
  userPhotoUrl: string;
  userName: string;
  userEmail: string;
  sestionTooltip: string;
  icon: React.ReactElement;
  sections: Section[];
}

const meta: Meta<typeof ProfileModal> = {
  title: 'Components/ProfileModal',
  component: ProfileModal,
  argTypes: {
    cancelButtonText: { control: 'text' },
    saveButtonText: { control: 'text' },
    passwordLabel: { control: 'text' },
    newPasswordLabel: { control: 'text' },
    confirmPasswordLabel: { control: 'text' },
    section: { control: 'text' },
    tooltipButtonProfile: { control: 'text' },
    userPhotoUrl: { control: 'text' },
    userName: { control: 'text' },
    userEmail: { control: 'text' },
    icon: { control: 'object' },
  },
};

export default meta;

type Story = StoryObj<ProfileModalProps>;

export const ProfileDefault: Story = {
  render: args => (
    <ProfileModal
      onRoleChange={() => {}}
      onWarehouseChange={() => {}}
      roles={[]}
      selectedRole={null}
      selectedWarehouse={null}
      {...args}
    />
  ),
  args: {
    section: 'profile',
    cancelButtonText: 'Cancel',
    saveButtonText: 'Save',
    passwordLabel: 'Password',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    tooltipButtonProfile: 'Account Settings',
    userPhotoUrl: profilePicture,
    userName: 'Ayelén García',
    userEmail: 'ayelen.garcia@etendo.software',
    sestionTooltip: 'Close Session',
    icon: <PersonIcon fill="#2E365C" />,
    sections: sections,
  },
};

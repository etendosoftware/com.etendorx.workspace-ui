import { Profile as ProfileModal } from '@workspaceui/componentlibrary/src/components';
import profilePicture from '@workspaceui/componentlibrary/src/assets/images/profile_picture_mock.png';
import PersonIcon from '@workspaceui/componentlibrary/src/assets/icons/user.svg';
import { sections } from './mock';
import type { Meta, StoryObj } from '@storybook/react';
import { ProfileModalProps } from '@workspaceui/componentlibrary/src/components/ProfileModal/types';

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
  render: args => <ProfileModal {...args} />,
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
    sectionTooltip: 'Close Session',
    icon: <PersonIcon fill="#2E365C" />,
    sections: sections,
  },
};

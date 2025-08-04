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

import { Profile as ProfileModal } from '@workspaceui/componentlibrary/src/components';
import profilePicture from '@workspaceui/componentlibrary/src/assets/images/profile_picture_mock.png';
import PersonIcon from '@workspaceui/componentlibrary/src/assets/icons/user.svg';
import { sections } from './mock';
import type { Meta, StoryObj } from '@storybook/react';
import type { ProfileModalProps } from '@workspaceui/componentlibrary/src/components/ProfileModal/types';

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
  render: (args) => <ProfileModal {...args} />,
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
    icon: <PersonIcon fill='#2E365C' />,
    sections: sections,
  },
};

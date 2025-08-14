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

import Nav from '@workspaceui/componentlibrary/src/components/Nav/Nav';
import NotificationModal from '@workspaceui/componentlibrary/src/components/NotificationsModal';
import NotificationButton from '@workspaceui/componentlibrary/src/components/NotificationsButton';
// import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import WaterfallModal from '@workspaceui/componentlibrary/src/components/Waterfall/WaterfallModal';
import ConfigurationModal from '@workspaceui/componentlibrary/src/components/ConfigurationModal';
import { NOTIFICATIONS } from '../notifications.mock';
import { modalConfig } from '../ConfigurationModal/mock';
import { menuItems, initialPeople } from '../mock';
import type { NavArgs } from './types';
import ActivityIcon from '@workspaceui/componentlibrary/src/assets/icons/activity.svg';
import profilePicture from '@workspaceui/componentlibrary/src/assets/images/profile_picture_mock.png';
import PersonIcon from '@workspaceui/componentlibrary/src/assets/icons/user.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import NotificationIcon from '@workspaceui/componentlibrary/src/assets/icons/bell.svg';
import AddIcon from '@workspaceui/componentlibrary/src/assets/icons/plus.svg';
// import { sections } from '../ProfileModal/mock';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Nav> = {
  title: 'Components/Nav',
  component: Nav,
};

export default meta;

type Story = StoryObj<NavArgs>;

export const DefaultNav: Story = {
  render: (args: NavArgs) => (
    <Nav>
      <div style={{ gap: '4px', display: 'flex' }}>
        <WaterfallModal
          menuItems={menuItems}
          initialPeople={initialPeople}
          backButtonText={args.backButtonText}
          activateAllText={args.activateAllText}
          deactivateAllText={args.deactivateAllText}
          tooltipWaterfallButton={args.tooltipWaterfallButton}
          buttonText={args.buttonText}
          customizeText={args.customizeText}
          people={[]}
          icon={<AddIcon />}
        />
        <ConfigurationModal {...modalConfig} />
        <IconButton tooltip='Activity'>
          <ActivityIcon />
        </IconButton>
        <NotificationButton notifications={args.notifications} icon={<NotificationIcon />}>
          <NotificationModal
            notifications={args.notifications}
            anchorEl={args.anchorEl}
            onClose={args.onClose}
            title={args.title}
            linkTitle={args.linkTitle}
            emptyStateImageAlt={args.emptyStateImageAlt}
            emptyStateMessage={args.emptyStateMessage}
            emptyStateDescription={args.emptyStateDescription}
            actionButtonLabel={args.actionButtonLabel}
          />
        </NotificationButton>
        {/* <ProfileModal
          cancelButtonText={args.cancelButtonText}
          saveButtonText={args.saveButtonText}
          tooltipButtonProfile={args.tooltipButtonProfile}
          section={args.section}
          passwordLabel={args.passwordLabel}
          newPasswordLabel={args.newPasswordLabel}
          confirmPasswordLabel={args.confirmPasswordLabel}
          userPhotoUrl={args.userPhotoUrl}
          userName={args.userName}
          userEmail={args.userEmail}
          sectionTooltip={args.sectionTooltip}
          icon={<PersonIcon fill='#2E365C' />}
          sections={args.sections}
          onRoleChange={() => {}}
          onWarehouseChange={() => {}}
          roles={[]}
          selectedRole={null}
          selectedWarehouse={null}
          saveAsDefault={false}
          onSaveAsDefaultChange={() => {}}
        /> */}
      </div>
    </Nav>
  ),
  args: {
    notifications: NOTIFICATIONS,
    anchorEl: null,
    open: true,
    onClose: () => console.log('Modal closed'),
    title: {
      icon: <NotificationIcon fill='#2E365C' />,
      label: 'Notifications',
    },
    linkTitle: { label: 'Mark all as read', url: '/home' },
    emptyStateImageAlt: 'No Notifications',
    emptyStateMessage: 'You have no notifications',
    emptyStateDescription:
      'Great! You are up to date with everything. We will notify you here if there is anything new.',
    actionButtonLabel: 'Configure notifications',
    backButtonText: 'Back',
    activateAllText: 'Activate all',
    deactivateAllText: 'Deactivate all',
    buttonText: 'Buttons',
    customizeText: 'Customize',
    tooltipWaterfallButton: 'Waterfall',
    cancelButtonText: 'Cancel',
    saveButtonText: 'Save',
    tooltipButtonProfile: 'Account Settings',
    passwordLabel: 'Password',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    section: 'profile',
    userPhotoUrl: profilePicture,
    userName: 'Ayelén García',
    userEmail: 'ayelen.garcia@etendo.software',
    sectionTooltip: 'Sign off',
    // sections: sections,
  },
};

import DrawerComponent from '../../../../../ComponentLibrary/src/components/Drawer';
import Nav from '../../../../../ComponentLibrary/src/components/Nav/Nav';
import NotificationModal from '../../../../../ComponentLibrary/src/components/NotificationsModal';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import ProfileModal from '../../../../../ComponentLibrary/src/components/ProfileModal/ProfileModal';
import WaterfallModal from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal';
import ConfigurationModal from '../../../../../ComponentLibrary/src/components/ConfigurationModal';
import { NOTIFICATIONS } from '../notifications.mock';
import logo from '../../../../../ComponentLibrary/src/assets/images/logo.svg?url';
import { modalConfig } from '../ConfigurationModal/mock';
import { menuItems, initialPeople } from '../mock';
import profilePicture from '../.././../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';
import NotificationIcon from '../../../../../ComponentLibrary/src/assets/icons/bell.svg';
import PersonIcon from '../../../../../ComponentLibrary/src/assets/icons/user.svg';
import ActivityIcon from '../../../../../ComponentLibrary/src/assets/icons/activity.svg';
import IconButton from '../../../../../ComponentLibrary/src/components/IconButton';
import AddIcon from '../../../../../ComponentLibrary/src/assets/icons/plus.svg';
import { sections } from '../ProfileModal/mock';
import type { Meta, StoryObj } from '@storybook/react';
import { DrawerProps } from '../../../../../ComponentLibrary/src/components/Drawer/types';
import { Inotifications } from '../../../../../ComponentLibrary/src/commons';
import { ReactElement } from 'react';
import { Section } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton/types';
import { sectionGroups } from '../../../../../MainUI/src/mocks';

interface ExtraProps {
  cancelButtonText: string;
  saveButtonText: string;
  notifications: Inotifications[];
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  title: { icon: string | ReactElement; label: string };
  linkTitle: { label: string; url: string };
  emptyStateImageAlt: string;
  emptyStateMessage: string;
  emptyStateDescription: string;
  actionButtonLabel: string;
  backButtonText: string;
  activateAllText: string;
  deactivateAllText: string;
  buttonText: string;
  customizeText: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  tooltipButtonProfile: string;
  tooltipWaterfallButton: string;
  section: string;
  userPhotoUrl: string;
  userName: string;
  userEmail: string;
  sestionTooltip: string;
  sections: Section[];
}

type StoryProps = DrawerProps & ExtraProps;

const meta: Meta<StoryProps> = {
  title: 'Components/Drawer',
  component: DrawerComponent,
  argTypes: {
    headerTitle: { control: 'text' },
    headerImage: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<StoryProps>;

export const GeneralDrawer: Story = {
  args: {
    headerTitle: 'Etendo',
    headerImage: logo,
    sectionGroups: sectionGroups,
  },
};

export const DrawerWithNav: Story = {
  args: {
    notifications: NOTIFICATIONS,
    anchorEl: null,
    open: true,
    onClose: () => console.log('Modal closed'),
    title: {
      icon: <NotificationIcon fill="#2E365C" />,
      label: 'Notifications',
    },
    linkTitle: { label: 'Mark all as read', url: '/home' },
    emptyStateImageAlt: 'No Notifications',
    emptyStateMessage: 'You have no notifications',
    emptyStateDescription:
      'Great! You are up to date with everything. We will notify you here if there is anything new.',
    actionButtonLabel: 'Configure notifications',
    // Waterfall
    backButtonText: 'Back',
    activateAllText: 'Activate all',
    deactivateAllText: 'Deactivate all',
    buttonText: 'Buttons',
    customizeText: 'Customize',
    // Profile Modal
    cancelButtonText: 'Cancel',
    saveButtonText: 'Save',
    tooltipButtonProfile: 'Account Settings',
    section: 'profile',
    passwordLabel: 'Password',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    userPhotoUrl: profilePicture,
    userName: 'Ayelén García',
    userEmail: 'ayelen.garcia@etendo.software',
    sestionTooltip: 'Sign off',
    sections: sections,
    //Drawer
    headerTitle: 'Etendo',
    headerImage: logo,
    sectionGroups: sectionGroups,
  },
  render: args => (
    <DrawerComponent {...args}>
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
          <IconButton tooltip="Activity">
            <ActivityIcon />
          </IconButton>
          <NotificationButton
            notifications={args.notifications}
            icon={<NotificationIcon />}>
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
          <ProfileModal
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
            sestionTooltip={args.sestionTooltip}
            icon={<PersonIcon fill="#2E365C" />}
            sections={args.sections}
          />
        </div>
      </Nav>
    </DrawerComponent>
  ),
};

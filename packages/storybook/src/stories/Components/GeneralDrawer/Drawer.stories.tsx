import DrawerComponent from '../../../../../ComponentLibrary/src/components/GeneralDrawer';
import Nav from '../../../../../ComponentLibrary/src/components/Nav/Nav';
import NotificationModal from '../../../../../ComponentLibrary/src/components/NotificationsModal';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import ProfileModal from '../../../../../ComponentLibrary/src/components/ProfileModal/ProfileModal';
import WaterfallModal from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal';
import ConfigurationModal from '../../../../../ComponentLibrary/src/components/ConfigurationModal';
import { NOTIFICATIONS } from '../notifications.mock';
import logo from '../../../../../ComponentLibrary/src/assets/images/logo.svg';
import { modalConfig } from '../ConfigurationModal/mock';
import { menuItems, initialPeople } from '../mock';
import { AutoAwesome } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import {
  sx,
  styles,
} from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.styles';
import profilePicture from '../.././../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';
import { sectionGroups } from './mock';

export default {
  title: 'Components/Drawer',
  component: DrawerComponent,
  argTypes: {
    tooltipTitle: { control: 'text' },
    companyName: { control: 'text' },
    companyLogo: { control: 'text' },
  },
};

const Template = args => <DrawerComponent {...args} />;

export const GeneralDrawer = Template.bind({});
GeneralDrawer.args = {
  companyName: 'Etendo',
  companyLogo: logo,
  sectionGroups: sectionGroups,
};

const DrawerWithNavTemplate = args => (
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
        />
        <ConfigurationModal {...modalConfig} />
        <IconButton style={styles.iconButtonStyles} sx={sx.hoverStyles}>
          <AutoAwesome sx={sx.iconStyles} />
        </IconButton>
        <NotificationButton notifications={args.notifications}>
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
        />
      </div>
    </Nav>
  </DrawerComponent>
);

export const DrawerWithNav = DrawerWithNavTemplate.bind({});
DrawerWithNav.args = {
  // Notification Modal
  notifications: NOTIFICATIONS,
  anchorEl: null,
  onClose: () => console.log('Modal closed'),
  title: { icon: logo, label: 'Notifications' },
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
  //Drawer
  companyName: 'Etendo',
  companyLogo: logo,
  sectionGroups: sectionGroups,
};

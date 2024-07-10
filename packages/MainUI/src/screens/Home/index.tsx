import { AutoAwesome } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import {
  ConfigurationModal,
  DrawerGeneral,
  Grid,
  NotificationButton,
  NotificationModal,
  Tab,
} from '@workspaceui/componentlibrary/src/components';
import Nav from '@workspaceui/componentlibrary/src/components/Nav/Nav';
import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import WaterfallModal from '@workspaceui/componentlibrary/src/components/Waterfall/WaterfallModal';
import { TabContent } from '@workspaceui/componentlibrary/src/interfaces';
import { NOTIFICATIONS } from '../../../../storybook/src/stories/Components/notifications.mock';
import logo from '../../assets/react.svg';
import { modalConfig } from '../../../../storybook/src/stories/Components/ConfigurationModal/mock';
import {
  menuItems,
  initialPeople,
} from '../../../../storybook/src/stories/Components/mock';
import {
  sx,
  styles,
} from '@workspaceui/componentlibrary/src/components/Waterfall/WaterfallModal.styles';
import { sectionGroups } from '../../../../storybook/src/stories/Components/GeneralDrawer/mock';
import companyLogo from '../../../../ComponentLibrary/src/assets/images/logo.svg';
import profilePicture from '../../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';

const Home = () => {
  const handleClose = () => {
    console.log('Modal closed');
  };

  const tabArray: TabContent[] = [
    {
      title: 'Navbar',
      children: (
        <Grid container spacing={2}>
          <Nav>
            <div style={{ gap: '4px', display: 'flex' }}>
              <WaterfallModal
                menuItems={menuItems}
                initialPeople={initialPeople}
                backButtonText="Back"
                activateAllText="Activate all"
                deactivateAllText="Deactivate all"
                tooltipWaterfallButton="Tooltip for waterfall button"
                buttonText="Buttons"
                customizeText="Customize"
                people={[]}
              />
              <ConfigurationModal {...modalConfig} />
              <IconButton style={styles.iconButtonStyles} sx={sx.hoverStyles}>
                <AutoAwesome sx={sx.iconStyles} />
              </IconButton>
              <NotificationButton notifications={NOTIFICATIONS}>
                <NotificationModal
                  notifications={NOTIFICATIONS}
                  anchorEl={null}
                  onClose={handleClose}
                  title={{ icon: logo, label: 'Notifications' }}
                  linkTitle={{ label: 'Mark all as read', url: '/home' }}
                  emptyStateImageAlt="No Notifications"
                  emptyStateMessage="You have no notifications"
                  emptyStateDescription="Great! You are up to date with everything. We will notify you here if there is anything new."
                  actionButtonLabel="Configure notifications"
                />
              </NotificationButton>
              <ProfileModal
                cancelButtonText="Cancel"
                saveButtonText="Save"
                tooltipButtonProfile="Account Settings"
                section="profile"
                passwordLabel="Password"
                newPasswordLabel="New Password"
                confirmPasswordLabel="Confirm New Password"
                userPhotoUrl={profilePicture}
                userName="Ayelén García"
                userEmail="ayelen.garcia@etendo.software"
              />
            </div>
          </Nav>
        </Grid>
      ),
    },
    {
      title: 'Drawer ',
      children: (
        <DrawerGeneral
          sectionGroups={sectionGroups}
          companyName={'Etendo'}
          companyLogo={companyLogo}>
          <Nav>
            <div style={{ gap: '4px', display: 'flex' }}>
              <WaterfallModal
                menuItems={menuItems}
                initialPeople={initialPeople}
                backButtonText="Back"
                activateAllText="Activate all"
                deactivateAllText="Deactivate all"
                tooltipWaterfallButton="Tooltip for waterfall button"
                buttonText="Buttons"
                customizeText="Customize"
                people={[]}
              />
              <ConfigurationModal {...modalConfig} />
              <IconButton style={styles.iconButtonStyles} sx={sx.hoverStyles}>
                <AutoAwesome sx={sx.iconStyles} />
              </IconButton>
              <NotificationButton notifications={NOTIFICATIONS}>
                <NotificationModal
                  notifications={NOTIFICATIONS}
                  anchorEl={null}
                  onClose={handleClose}
                  title={{ icon: logo, label: 'Notifications' }}
                  linkTitle={{ label: 'Mark all as read', url: '/home' }}
                  emptyStateImageAlt="No Notifications"
                  emptyStateMessage="You have no notifications"
                  emptyStateDescription="Great! You are up to date with everything. We will notify you here if there is anything new."
                  actionButtonLabel="Configure notifications"
                />
              </NotificationButton>
              <ProfileModal
                cancelButtonText="Cancel"
                saveButtonText="Save"
                tooltipButtonProfile="Account Settings"
                section="profile"
                passwordLabel="Password"
                newPasswordLabel="New Password"
                confirmPasswordLabel="Confirm New Password"
                userPhotoUrl={profilePicture}
                userName="Ayelén García"
                userEmail="ayelen.garcia@etendo.software"
              />
            </div>
          </Nav>
        </DrawerGeneral>
      ),
    },
  ];

  return (
    <div className="container">
      <Tab tabArray={tabArray} />
    </div>
  );
};

export default Home;

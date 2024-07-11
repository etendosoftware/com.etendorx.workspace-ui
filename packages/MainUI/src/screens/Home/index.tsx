import { AutoAwesome } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import {
  ConfigurationModal,
  Drawer,
  NotificationButton,
  NotificationModal,
} from '@workspaceui/componentlibrary/src/components';
import Nav from '@workspaceui/componentlibrary/src/components/Nav/Nav';
import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import WaterfallModal from '@workspaceui/componentlibrary/src/components/Waterfall/WaterfallModal';
import { NOTIFICATIONS } from '../../../../storybook/src/stories/Components/notifications.mock';
import logo from '../../assets/react.svg';
import { modalConfig } from '../../../../storybook/src/stories/Components/ConfigurationModal/mock';
import {
  menuItems,
  initialPeople,
} from '../../../../storybook/src/stories/Components/mock';
import { sx } from '@workspaceui/componentlibrary/src/components/Waterfall/WaterfallModal.styles';
import { sectionGroups } from '../../mocks';
import EtendoLogotype from '../../assets/etendo-logotype.png';
import profilePicture from '../../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';
import { styles } from './styles';

const Home = () => {
  const handleClose = () => {
    console.log('Modal closed');
  };

  return (
    <Box sx={styles.fullScreenBox}>
      <Drawer
        headerImage={EtendoLogotype}
        headerTitle="Etendo"
        sectionGroups={sectionGroups}>
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
            <IconButton sx={sx.hoverStyles}>
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
              userName={'Ayelén García'}
              userEmail={'ayelen.garcia@etendo.software'}
            />
          </div>
        </Nav>
      </Drawer>
    </Box>
  );
};

export default Home;

import { Box } from '@mui/material';
import {
  ConfigurationModal,
  Drawer,
  NotificationButton,
  NotificationModal,
  Table,
} from '@workspaceui/componentlibrary/src/components';
import Nav from '@workspaceui/componentlibrary/src/components/Nav/Nav';
import ProfileModal from '@workspaceui/componentlibrary/src/components/ProfileModal/ProfileModal';
import WaterfallModal from '@workspaceui/componentlibrary/src/components/Waterfall/WaterfallModal';
import { NOTIFICATIONS } from '../../../../storybook/src/stories/Components/notifications.mock';
import { modalConfig } from '../../../../storybook/src/stories/Components/ConfigurationModal/mock';
import {
  menuItems,
  initialPeople,
} from '../../../../storybook/src/stories/Components/mock';
import { sectionGroups } from '../../mocks';
import EtendoLogotype from '../../assets/etendo-logotype.png';
import profilePicture from '../../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';
import { styles } from './styles';
import ActivityIcon from '../../../../ComponentLibrary/src/assets/icons/activity.svg';
import NotificationIcon from '../../../../ComponentLibrary/src/assets/icons/bell.svg';
import PersonIcon from '../../../../ComponentLibrary/src/assets/icons/user.svg';
import AddIcon from '../../../../ComponentLibrary/src/assets/icons/plus.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { FlatData } from '../../../../storybook/src/stories/Components/Table/mock';

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
              tooltipWaterfallButton="Waterfall Tooltip"
              buttonText="Buttons"
              customizeText="Customize"
              people={[]}
              icon={<AddIcon />}
            />
            <ConfigurationModal
              {...modalConfig}
              tooltipButtonProfile="Settings"
            />
            <IconButton tooltip="Activity">
              <ActivityIcon />
            </IconButton>
            <NotificationButton
              notifications={NOTIFICATIONS}
              icon={<NotificationIcon />}>
              <NotificationModal
                notifications={NOTIFICATIONS}
                anchorEl={null}
                onClose={handleClose}
                title={{
                  icon: <NotificationIcon fill="#2E365C" />,
                  label: 'Notifications',
                }}
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
              icon={<PersonIcon />}
            />
          </div>
        </Nav>
        <Table
          data={FlatData}
          isTreeStructure={false}
          customLabels={{
            identificator: 'Custom Identificator',
          }}
        />
      </Drawer>
    </Box>
  );
};

export default Home;

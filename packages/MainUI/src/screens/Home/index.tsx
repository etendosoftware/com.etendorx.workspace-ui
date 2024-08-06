import { Box } from '@mui/material';
import {
  ConfigurationModal,
  Drawer,
  NotificationButton,
  NotificationModal,
  Table,
  IconButton,
  Navbar,
  Profile,
  Waterfall,
} from '@workspaceui/componentlibrary/src/components';
import { sectionGroups } from '../../mocks';
import EtendoLogotype from '../../assets/etendo-logotype.png';
import profilePicture from '../../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';
import { styles } from './styles';
import ActivityIcon from '../../../../ComponentLibrary/src/assets/icons/activity.svg';
import NotificationIcon from '../../../../ComponentLibrary/src/assets/icons/bell.svg';
import PersonIcon from '../../../../ComponentLibrary/src/assets/icons/user.svg';
import AddIcon from '../../../../ComponentLibrary/src/assets/icons/plus.svg';
import {
  modalConfig,
  menuItems,
  initialPeople,
  sections,
  NOTIFICATIONS,
  FlatData,
} from '@workspaceui/storybook/mocks';

const Home = (props: React.PropsWithChildren) => {
  const handleClose = () => {
    console.log('Modal closed');
  };

  return (
    <Box sx={styles.fullScreenBox}>
      <Drawer
        headerImage={EtendoLogotype}
        headerTitle="Etendo"
        sectionGroups={sectionGroups}>
        <Navbar>
          <div style={{ gap: '4px', display: 'flex' }}>
            <Waterfall
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
            <Profile
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
              sestionTooltip={'Sign off'}
              icon={<PersonIcon />}
              sections={sections}
            />
          </div>
        </Navbar>
        <Table
          data={FlatData}
          isTreeStructure={true}
          customLabels={{
            identificator: 'Home Identificator',
          }}
        />
      </Drawer>
      {props.children}
    </Box>
  );
};

export default Home;

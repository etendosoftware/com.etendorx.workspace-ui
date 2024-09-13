import {
  ConfigurationModal,
  NotificationButton,
  NotificationModal,
  IconButton,
  Navbar,
  Profile,
  Waterfall,
} from '@workspaceui/componentlibrary/src/components';
import profilePicture from '@workspaceui/componentlibrary/src/assets/images/profile_picture_mock.png';
import ActivityIcon from '@workspaceui/componentlibrary/src/assets/icons/activity.svg';
import NotificationIcon from '@workspaceui/componentlibrary/src/assets/icons/bell.svg';
import PersonIcon from '@workspaceui/componentlibrary/src/assets/icons/user.svg';
import AddIcon from '@workspaceui/componentlibrary/src/assets/icons/plus.svg';
import {
  modalConfig,
  menuItems,
  initialPeople,
  sections,
  NOTIFICATIONS,
} from '@workspaceui/storybook/mocks';

const handleClose = () => {
  return true;
};

const Navigation = () => (
  <Navbar>
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
    <ConfigurationModal {...modalConfig} tooltipButtonProfile="Settings" />
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
  </Navbar>
);

export default Navigation;

import React from 'react';
import {
  ConfigurationModal,
  NotificationButton,
  NotificationModal,
  IconButton,
  Navbar,
  Profile,
  Waterfall,
} from '@workspaceui/componentlibrary/components';
import profilePicture from '@workspaceui/componentlibrary/assets/images/profile_picture_mock.png';
import ActivityIcon from '@workspaceui/componentlibrary/assets/icons/activity.svg';
import NotificationIcon from '@workspaceui/componentlibrary/assets/icons/bell.svg';
import PersonIcon from '@workspaceui/componentlibrary/assets/icons/user.svg';
import AddIcon from '@workspaceui/componentlibrary/assets/icons/plus.svg';
import {
  modalConfig,
  menuItems,
  initialPeople,
  sections,
  NOTIFICATIONS,
} from '@workspaceui/storybook/mocks';
import { useTranslation } from '../hooks/useTranslation';

const handleClose = () => {
  return true;
};

const Navigation: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Navbar>
      <Waterfall
        menuItems={menuItems}
        initialPeople={initialPeople}
        backButtonText={t('modal.secondaryButtonLabel')}
        activateAllText={t('navigation.waterfall.activateAll')}
        deactivateAllText={t('navigation.waterfall.deactivateAll')}
        tooltipWaterfallButton={t('navigation.waterfall.tooltipButton')}
        buttonText={t('navigation.waterfall.buttons')}
        customizeText={t('navigation.waterfall.customize')}
        people={[]}
        icon={<AddIcon />}
      />
      <ConfigurationModal
        {...modalConfig}
        tooltipButtonProfile={t(
          'navigation.configurationModal.tooltipButtonProfile',
        )}
      />
      <IconButton tooltip={t('navigation.activityButton.tooltip')}>
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
            label: t('navigation.notificationModal.title'),
          }}
          linkTitle={{
            label: t('navigation.notificationModal.markAllAsRead'),
            url: '/home',
          }}
          emptyStateImageAlt={t(
            'navigation.notificationModal.emptyStateImageAlt',
          )}
          emptyStateMessage={t(
            'navigation.notificationModal.emptyStateMessage',
          )}
          emptyStateDescription={t(
            'navigation.notificationModal.emptyStateDescription',
          )}
          actionButtonLabel={t(
            'navigation.notificationModal.actionButtonLabel',
          )}
        />
      </NotificationButton>
      <Profile
        cancelButtonText={t('common.cancel')}
        saveButtonText={t('common.save')}
        tooltipButtonProfile={t('navigation.profile.tooltipButtonProfile')}
        section="profile"
        passwordLabel={t('navigation.profile.passwordLabel')}
        newPasswordLabel={t('navigation.profile.newPasswordLabel')}
        confirmPasswordLabel={t('navigation.profile.confirmPasswordLabel')}
        userPhotoUrl={profilePicture}
        userName={'Ayelén García'}
        userEmail={'ayelen.garcia@etendo.software'}
        sestionTooltip={t('navigation.profile.signOffTooltip')}
        icon={<PersonIcon />}
        sections={sections}
      />
    </Navbar>
  );
};

export default Navigation;

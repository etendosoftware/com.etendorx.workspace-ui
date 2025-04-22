'use client';

import {
  ConfigurationModal,
  NotificationButton,
  NotificationModal,
  IconButton,
  Waterfall,
} from '@workspaceui/componentlibrary/src/components';
import ActivityIcon from '@workspaceui/componentlibrary/src/assets/icons/activity.svg';
import NotificationIcon from '@workspaceui/componentlibrary/src/assets/icons/bell.svg';
import PersonIcon from '@workspaceui/componentlibrary/src/assets/icons/user.svg';
import AddIcon from '@workspaceui/componentlibrary/src/assets/icons/plus.svg';
import { modalConfig, menuItems, initialPeople, sections, NOTIFICATIONS } from '../../storybook/src/mocks';
import { Person } from '@workspaceui/componentlibrary/src/components/DragModal/DragModal.types';
import Nav from '@workspaceui/componentlibrary/src/components/Nav/Nav';
import { useTranslation } from '../hooks/useTranslation';
import ProfileWrapper from './Nav/Profile';

const handleClose = () => {
  return true;
};

const people: Person[] = [];

const Navigation: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Nav>
      <Waterfall
        menuItems={menuItems}
        initialPeople={initialPeople}
        backButtonText={t('modal.secondaryButtonLabel')}
        activateAllText={t('navigation.waterfall.activateAll')}
        deactivateAllText={t('navigation.waterfall.deactivateAll')}
        tooltipWaterfallButton={t('navigation.waterfall.tooltipButton')}
        buttonText={t('navigation.waterfall.buttons')}
        customizeText={t('navigation.waterfall.customize')}
        people={people}
        icon={<AddIcon />}
      />
      <ConfigurationModal
        {...modalConfig}
        tooltipButtonProfile={t('navigation.configurationModal.tooltipButtonProfile')}
      />
      <IconButton tooltip={t('navigation.activityButton.tooltip')} disabled={true}>
        <ActivityIcon />
      </IconButton>
      <NotificationButton notifications={NOTIFICATIONS} icon={<NotificationIcon />}>
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
          emptyStateImageAlt={t('navigation.notificationModal.emptyStateImageAlt')}
          emptyStateMessage={t('navigation.notificationModal.emptyStateMessage')}
          emptyStateDescription={t('navigation.notificationModal.emptyStateDescription')}
          actionButtonLabel={t('navigation.notificationModal.actionButtonLabel')}
        />
      </NotificationButton>
      <ProfileWrapper
        cancelButtonText={t('common.cancel')}
        saveButtonText={t('common.save')}
        tooltipButtonProfile={t('navigation.profile.tooltipButtonProfile')}
        passwordLabel={t('navigation.profile.passwordLabel')}
        newPasswordLabel={t('navigation.profile.newPasswordLabel')}
        confirmPasswordLabel={t('navigation.profile.confirmPasswordLabel')}
        sectionTooltip={t('navigation.profile.signOffTooltip')}
        icon={<PersonIcon />}
        sections={sections}
        section={''}
        translations={{
          saveAsDefault: t('navigation.profile.saveAsDefault'),
        }}
      />
    </Nav>
  );
};

export default Navigation;

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
import ProfileModal from './ProfileModal/ProfileModal';
import { useLanguage } from '@/contexts/language';
import { Language } from '@/contexts/types';
import { UserContext } from '@/contexts/user';
import { logger } from '@/utils/logger';
import { useContext, useState, useCallback, useMemo } from 'react';

const handleClose = () => {
  return true;
};

const people: Person[] = [];

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const {
    setDefaultConfiguration,
    currentRole,
    currentOrganization,
    profile,
    currentWarehouse,
    changeProfile,
    roles,
    languages,
  } = useContext(UserContext);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const { language, setLanguage, getFlag } = useLanguage();

  const { clearUserData } = useContext(UserContext);

  const handleSignOff = useCallback(() => {
    clearUserData();
  }, [clearUserData]);

  const handleSaveAsDefaultChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSaveAsDefault(event.target.checked);
  }, []);

  const languagesWithFlags = useMemo(() => {
    return languages.map(lang => ({
      ...lang,
      flagEmoji: getFlag(lang.language as Language),
      displayName: `${getFlag(lang.language as Language)} ${lang.name}`,
    }));
  }, [languages, getFlag]);

  const flagString = getFlag(language);

  if (!currentRole) {
    return null;
  }

  return (
    <Nav title={t('common.notImplemented')}>
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
      <ProfileModal
        icon={<PersonIcon />}
        sections={sections}
        section={''}
        translations={{
          saveAsDefault: t('navigation.profile.saveAsDefault'),
        }}
        currentRole={currentRole}
        currentWarehouse={currentWarehouse}
        currentOrganization={currentOrganization}
        roles={roles}
        saveAsDefault={saveAsDefault}
        onSaveAsDefaultChange={handleSaveAsDefaultChange}
        onLanguageChange={setLanguage}
        language={language}
        languagesFlags={flagString}
        changeProfile={changeProfile}
        onSetDefaultConfiguration={setDefaultConfiguration}
        logger={logger}
        onSignOff={handleSignOff}
        languages={languagesWithFlags}
        userName={profile.name}
        userEmail={profile.email}
        userPhotoUrl={profile.image}
      />
    </Nav>
  );
};

export default Navigation;

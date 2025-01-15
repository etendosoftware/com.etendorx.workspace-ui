'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import { useMenu } from '@workspaceui/etendohookbinder/src/hooks/useMenu';
import EtendoLogotype from '../public/etendo.png';
import { useTranslation } from '../hooks/useTranslation';
import { useUserContext } from '../hooks/useUserContext';
import { WindowParams } from '../app/types';
import { useLanguage } from '../hooks/useLanguage';
import RecentlyViewed from './Drawer/RecentlyViewed';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useMenuTranslation } from '../hooks/useMenuTranslation';

export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole } = useUserContext();
  const { language } = useLanguage();
  const { translateMenuItem } = useMenuTranslation();

  const menu = useMenu(token, currentRole || undefined, language);
  const router = useRouter();
  const { windowId } = useParams<WindowParams>();

  const handleClick = useCallback(
    (pathname: string) => {
      router.push(pathname);
    },
    [router],
  );

  const getTranslatedName = useCallback((item: Menu) => translateMenuItem(item), [translateMenuItem]);

  return (
    <Drawer
      windowId={windowId}
      logo={EtendoLogotype.src}
      title={t('common.etendo')}
      items={menu}
      onClick={handleClick}
      onReportClick={handleClick}
      onProcessClick={handleClick}
      getTranslatedName={getTranslatedName}
      RecentlyViewedComponent={RecentlyViewed}
    />
  );
}

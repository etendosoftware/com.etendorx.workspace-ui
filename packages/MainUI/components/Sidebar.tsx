'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Drawer from '@workspaceui/componentlibrary/src/components/Drawer';
import { useMenu } from '@workspaceui/etendohookbinder/src/hooks/useMenu';
import EtendoLogotype from '../public/etendo.png';
import { useTranslation } from '../hooks/useTranslation';
import { useUserContext } from '../hooks/useUserContext';
import { WindowParams } from '../app/types';
import RecentlyViewed from './Drawer/RecentlyViewed';
import { Menu } from '@workspaceui/etendohookbinder/src/api/types';
import { useMenuTranslation } from '../hooks/useMenuTranslation';
import { createSearchIndex, filterItems } from '@workspaceui/componentlibrary/src/utils/searchUtils';
import { useLanguage } from '@/contexts/language';

export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole, prevRole } = useUserContext();
  const { language, prevLanguage } = useLanguage();
  const { translateMenuItem } = useMenuTranslation();
  const menu = useMenu(token, currentRole || undefined, language);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { windowId } = useParams<WindowParams>();

  const [searchValue, setSearchValue] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const searchIndex = useMemo(() => createSearchIndex(menu), [menu]);
  const { filteredItems, searchExpandedItems } = useMemo(() => {
    const result = filterItems(menu, searchValue, searchIndex);

    return result;
  }, [menu, searchValue, searchIndex]);

  const handleClick = useCallback(
    (windowId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('windowId', windowId);
      if (pathname.includes('window')) {
        window.history.pushState(null, '', `?${params.toString()}`);
      } else {
        router.push(`window?${params.toString()}`);
      }
    },
    [pathname, router, searchParams],
  );

  const searchContext = useMemo(
    () => ({
      searchValue,
      setSearchValue,
      filteredItems,
      searchExpandedItems,
      expandedItems,
      setExpandedItems,
      searchIndex,
    }),
    [expandedItems, filteredItems, searchExpandedItems, searchIndex, searchValue],
  );

  const getTranslatedName = useCallback((item: Menu) => translateMenuItem(item), [translateMenuItem]);

  useEffect(() => {
    if (prevRole?.id !== currentRole?.id || prevLanguage !== language) {
      setSearchValue('');
    }
  }, [currentRole?.id, language, prevLanguage, prevRole?.id]);

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
      searchContext={searchContext}
    />
  );
}

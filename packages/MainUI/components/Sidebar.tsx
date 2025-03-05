'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { createSearchIndex, filterItems } from '@workspaceui/componentlibrary/src/utils/searchUtils';

export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole } = useUserContext();
  const { language } = useLanguage();
  const { translateMenuItem } = useMenuTranslation();
  const menu = useMenu(token, currentRole || undefined, language);
  const router = useRouter();
  const { windowId } = useParams<WindowParams>();

  const [searchValue, setSearchValue] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const searchIndex = useMemo(() => createSearchIndex(menu), [menu]);
  const { filteredItems, searchExpandedItems } = useMemo(() => {
    console.time('filterItems');
    const result = filterItems(menu, searchValue, searchIndex);
    console.timeEnd('filterItems');

    return result;
  }, [menu, searchValue, searchIndex]);

  const handleClick = useCallback(
    (pathname: string) => {
      router.push(pathname);
    },
    [router],
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

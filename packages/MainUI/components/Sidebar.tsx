'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Drawer from '@workspaceui/componentlibrary/src/components/Drawer';
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
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const searchIndex = useMemo(() => createSearchIndex(menu), [menu]);
  const { filteredItems, searchExpandedItems } = useMemo(() => {
    return filterItems(menu, searchValue, searchIndex);
  }, [menu, searchValue, searchIndex]);

  const normalizeId = (id: string) => id.replace(/^\/?window\/?/, '');

  const handleClick = useCallback(
    (idRaw: string) => {
      const id = normalizeId(idRaw);
      const params = new URLSearchParams(searchParams.toString());

      const currentActive = params.get('active');
      if (currentActive === id) return;

      const cleanedWindowIds = params
        .getAll('windowId')
        .map(normalizeId)
        .filter((v, i, arr) => v && arr.indexOf(v) === i);

      if (!cleanedWindowIds.includes(id)) {
        cleanedWindowIds.push(id);
      }

      params.delete('windowId');
      cleanedWindowIds.forEach(i => params.append('windowId', i));
      params.set('active', id);

      const href = `/window?${params.toString()}`;
      router.push(href);
    },
    [searchParams]
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
    [expandedItems, filteredItems, searchExpandedItems, searchIndex, searchValue]
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

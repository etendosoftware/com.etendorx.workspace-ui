'use client';

import { useCallback, useMemo, useState } from 'react';
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

function filterMenusByNameTailRecursive(
  items: Menu[],
  search: string,
  acc: Menu[] = []
): Menu[] {
  if (items.length === 0) return acc;

  const [head, ...rest] = items;
  const normalizedSearch = search.toLowerCase();

  const nameMatches = head.name.toLowerCase().includes(normalizedSearch);
  const filteredChildren = head.children
    ? filterMenusByNameTailRecursive(head.children, search)
    : [];

  if (nameMatches || filteredChildren.length > 0) {
    const newItem: Menu = {
      ...head,
      children: filteredChildren.length > 0 ? filteredChildren : undefined,
    };
    return filterMenusByNameTailRecursive(rest, search, [...acc, newItem]);
  }

  return filterMenusByNameTailRecursive(rest, search, acc);
}

function filterMenusByName(menuItems: Menu[], search: string): Menu[] {
  return filterMenusByNameTailRecursive(menuItems, search);
}

function filterMenusByNameStrict(menuItems: Menu[], search: string): Menu[] {
  const normalizedSearch = search.toLowerCase();

  function filterRecursive(items: Menu[]): Menu[] {
    return items.reduce<Menu[]>((acc, item) => {
      const nameMatches = item.name.toLowerCase().includes(normalizedSearch);
      const filteredChildren = item.children ? filterRecursive(item.children) : [];

      // Solo agregamos el nodo si él matchea o alguno de sus hijos
      if (nameMatches || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined,
        });
      }

      return acc;
    }, []);
  }

  return filterRecursive(menuItems);
}



export default function Sidebar() {
  const { t } = useTranslation();
  const { token, currentRole } = useUserContext();
  const { language } = useLanguage();
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

  return (
    <Drawer
      windowId={windowId}
      logo={EtendoLogotype.src}
      title={t('common.etendo')}
      items={filterMenusByNameStrict(menu, searchValue)}
      onClick={handleClick}
      onReportClick={handleClick}
      onProcessClick={handleClick}
      getTranslatedName={getTranslatedName}
      RecentlyViewedComponent={RecentlyViewed}
      searchContext={searchContext}
    />
  );
}

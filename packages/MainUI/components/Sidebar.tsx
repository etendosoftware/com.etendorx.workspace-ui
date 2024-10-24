'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from '@workspaceui/componentlibrary/components';
import { useMenu } from '@workspaceui/etendohookbinder/hooks/useMenu';
import EtendoLogotype from '../public/etendo-logotype.png';
import { useTranslation } from '../hooks/useTranslation';
import { useUserContext } from '../hooks/useUserContext';

export default function Sidebar() {
  const { t } = useTranslation();
  const { token } = useUserContext();
  const menu = useMenu(token);
  const router = useRouter();

  const handleClick = useCallback(
    (pathname: string) => {
      router.push(pathname);
    },
    [router],
  );

  const logoUrl = typeof EtendoLogotype === 'string' ? EtendoLogotype : '/assets/etendo-logotype.png';

  return <Drawer logo={logoUrl} title={t('common.etendo')} items={menu} onClick={handleClick} />;
}

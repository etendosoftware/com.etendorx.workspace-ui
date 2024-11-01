import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Drawer from '@workspaceui/componentlibrary/components/Drawer';
import { useMenu } from '@workspaceui/etendohookbinder/hooks/useMenu';
import EtendoLogotype from '../public/etendo-logotype.png';
import { useTranslation } from '../hooks/useTranslation';
import { useUserContext } from '../hooks/useUserContext';
import { useTheme } from '@mui/material/styles';

const logoUrl = typeof EtendoLogotype === 'string' ? EtendoLogotype : '/assets/etendo-logotype.png';

export default function Sidebar() {
  const theme = useTheme();

  useEffect(() => {
    console.debug('packages/MainUI/components/Sidebar:', theme.palette);
  }, [theme]);

  const { t } = useTranslation();
  const { token, currentRole } = useUserContext();
  const menu = useMenu(token, currentRole);
  const router = useRouter();
  const { windowId } = useParams<{ windowId?: string }>();

  const handleClick = useCallback(
    (pathname: string) => {
      router.push(pathname);
    },
    [router],
  );

  return <Drawer windowId={windowId} logo={logoUrl} title={t('common.etendo')} items={menu} onClick={handleClick} />;
}

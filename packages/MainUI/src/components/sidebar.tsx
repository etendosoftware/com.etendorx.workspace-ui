import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '@workspaceui/componentlibrary/components';
import { useMenu } from '@workspaceui/etendohookbinder/hooks/useMenu';
import EtendoLogotype from '../assets/etendo-logotype.png';
import { useUserContext } from '../hooks/useUserContext';
import { useTranslation } from '../hooks/useTranslation';

export default function Sidebar() {
  const { t } = useTranslation();
  const { token } = useUserContext();
  const menu = useMenu(token);
  const navigate = useNavigate();

  const handleClick = useCallback(
    (pathname: string) => navigate({ pathname }),
    [navigate],
  );

  return (
    <Drawer
      logo={EtendoLogotype}
      title={t('common.etendo')}
      items={menu}
      onClick={handleClick}
    />
  );
}

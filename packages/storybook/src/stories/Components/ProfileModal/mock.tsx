import ProfileIcon from '@workspaceui/componentlibrary/src/assets/icons/profile.svg';
import LockIcon from '@workspaceui/componentlibrary/src/assets/icons/lock.svg';
import type { Section } from '@workspaceui/mainui/components/ProfileModal/ToggleButton/types';

const defaultFill = '#6B7280';

export const sections: Section[] = [
  {
    id: 'profile',
    label: 'Perfil',
    icon: <ProfileIcon fill={defaultFill} />,
  },
  {
    id: 'password',
    label: 'Contraseña',
    icon: <LockIcon fill={defaultFill} />,
  },
];

export const mockRoles = [
  { id: '1', name: 'Admin', orgList: [{ id: '1', name: '1', warehouseList: [{ id: 'w1', name: 'Warehouse 1' }] }] },
  { id: '2', name: 'User', orgList: [{ id: '2', name: '2', warehouseList: [{ id: 'w2', name: 'Warehouse 2' }] }] },
];

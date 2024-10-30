import { Section } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton/types';
import PersonOutlineIcon from '../../../../../ComponentLibrary/src/assets/icons/check-circle.svg';
import LockIcon from '../../../../../ComponentLibrary/src/assets/icons/lock.svg';

const defaultFill = '#6B7280';

export const sections: Section[] = [
  {
    id: 'profile',
    label: 'Perfil',
    icon: <PersonOutlineIcon fill={defaultFill} />,
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

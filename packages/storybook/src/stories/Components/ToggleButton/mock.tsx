import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import { Section } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton/types';

export const sectionsMock: Section[] = [
  { id: 'profile', label: 'Perfil', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Contraseña', icon: <LockIcon /> },
];

export const sectionsMock3: Section[] = [
  { id: 'profile', label: 'Perfil', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Contraseña', icon: <LockIcon /> },
  { id: 'home', label: 'Inicio', icon: <HomeIcon /> },
];

export const sectionsMock4: Section[] = [
  { id: 'profile', label: 'Perfil', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Contraseña', icon: <LockIcon /> },
  { id: 'home', label: 'Inicio', icon: <HomeIcon /> },
  { id: 'settings', label: 'Configuración', icon: <SettingsIcon /> },
];

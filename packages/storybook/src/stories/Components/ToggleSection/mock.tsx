import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';
import { Section } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleSection/ToggleSection.types';

export const sectionsMock: Section[] = [
  { id: 'profile', label: 'Perfil', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Contraseña', icon: <LockIcon /> },
];

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import { Section } from '@workspaceui/componentlibrary/src/components/ProfileModal/ToggleButton/types';

export const sectionsMock: Section[] = [
  { id: 'profile', label: 'Profile', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Password', icon: <LockIcon /> },
];

export const sectionsMock3: Section[] = [
  { id: 'profile', label: 'Profile', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Password', icon: <LockIcon /> },
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
];

export const sectionsMock4: Section[] = [
  { id: 'profile', label: 'Profile', icon: <PersonOutlineIcon /> },
  { id: 'password', label: 'Password', icon: <LockIcon /> },
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

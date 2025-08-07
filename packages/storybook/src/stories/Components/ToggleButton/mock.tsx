/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import type { Section } from '@workspaceui/componentlibrary/src/components/ProfileModal/ToggleButton/types';

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

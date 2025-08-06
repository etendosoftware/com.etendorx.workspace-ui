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

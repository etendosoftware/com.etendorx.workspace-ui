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

export const mockRoles = [
  {
    id: '1',
    name: 'Admin',
    orgList: [
      {
        id: 'org1',
        name: 'Organization 1',
        warehouseList: [
          { id: 'wh1', name: 'Warehouse 1' },
          { id: 'wh2', name: 'Warehouse 2' },
        ],
      },
      {
        id: 'org2',
        name: 'Organization 2',
        warehouseList: [
          { id: 'wh3', name: 'Warehouse 3' },
          { id: 'wh4', name: 'Warehouse 4' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'User',
    orgList: [
      {
        id: 'org3',
        name: 'Organization 3',
        warehouseList: [
          { id: 'wh5', name: 'Warehouse 5' },
          { id: 'wh6', name: 'Warehouse 6' },
        ],
      },
    ],
  },
];

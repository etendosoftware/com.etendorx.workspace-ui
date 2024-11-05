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

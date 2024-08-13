import { Organization } from './types';

export const FlatData: Organization[] = [
  {
    identificator: '0',
    name: '*',
    description: 'All Organizations',
    active: true,
    groupLevel: true,
    socialName: 'Global Org',
    organizationType: 'Holding',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 10,
    tags: ['global', 'main'],
    reactions: 50,
    type: '💳 Record',
    id: '0',
    parentId: null,
  },
  {
    identificator: 'F&B International Group',
    name: 'F&B International Group',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: '💳 Record',
    id: '1',
    parentId: '0',
  },
  {
    identificator: 'F&B Spain, S.A',
    name: 'F&B Spain, S.A',
    description: '',
    active: false,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '2',
    parentId: '1',
  },
  {
    identificator: 'F&B US, Inc',
    name: 'F&B US, Inc',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '3',
    parentId: '1',
  },
  {
    identificator: 'F&B Spain, North',
    name: 'F&B Spain, North',
    description: '',
    active: false,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '4',
    parentId: '2',
  },
  {
    identificator: 'F&B Spain, South',
    name: 'F&B Spain, South',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '5',
    parentId: '2',
  },
  {
    identificator: 'F&B US, North',
    name: 'F&B US, North',
    description: '',
    active: false,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '6',
    parentId: '3',
  },
  {
    identificator: 'F&B US, South',
    name: 'F&B US, South',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '7',
    parentId: '3',
  },
];

export const TreeData: Organization[] = [
  {
    identificator: '0',
    name: '*',
    description: 'All Organizations',
    active: true,
    groupLevel: true,
    socialName: 'Global Org',
    organizationType: 'Holding',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 10,
    tags: ['global', 'main'],
    reactions: 50,
    type: 'record',
    id: '0',
    parentId: null,
  },
  {
    identificator: 'F&B International Group',
    name: 'F&B International Group',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '1',
    parentId: '0',
  },
  {
    identificator: 'F&B Spain, S.A',
    name: 'F&B Spain, S.A',
    description: '',
    active: false,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '2',
    parentId: '1',
  },
  {
    identificator: 'F&B US, Inc',
    name: 'F&B US, Inc',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '3',
    parentId: '1',
  },
  {
    identificator: 'F&B Spain, North',
    name: 'F&B Spain, North',
    description: '',
    active: false,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '4',
    parentId: '2',
  },
  {
    identificator: 'F&B Spain, South',
    name: 'F&B Spain, South',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'EUR',
    allowPeriodControl: true,
    calendar: 'Spain',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '5',
    parentId: '2',
  },
  {
    identificator: 'F&B US, North',
    name: 'F&B US, North',
    description: '',
    active: false,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '6',
    parentId: '3',
  },
  {
    identificator: 'F&B US, South',
    name: 'F&B US, South',
    description: '',
    active: true,
    groupLevel: true,
    socialName: 'Int Group',
    organizationType: 'Group',
    currency: 'USD',
    allowPeriodControl: true,
    calendar: 'USA',
    files: 8,
    tags: ['international', 'group'],
    reactions: 30,
    type: 'record',
    id: '7',
    parentId: '3',
  },
];

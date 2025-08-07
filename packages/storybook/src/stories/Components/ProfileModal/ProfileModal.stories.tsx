import React from 'react';
import ProfileModal from '@workspaceui/mainui/components/ProfileModal/ProfileModal';
import profilePicture from '@workspaceui/componentlibrary/src/assets/images/profile_picture_mock.png';
import PersonIcon from '@workspaceui/componentlibrary/src/assets/icons/user.svg';
import { sections } from './mock';
import type { Meta, StoryObj } from '@storybook/react';
import type { ProfileModalProps } from '@workspaceui/mainui/components/ProfileModal/types';
import LanguageProvider from '@workspaceui/mainui/contexts/language';
import { getLanguageFlag } from '@workspaceui/mainui/utils/languageFlags';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Crear un wrapper que proporcione el contexto de idioma
// Mock router para LanguageProvider
const mockRouter = {
  push: () => Promise.resolve(true),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  isFallback: false,
  basePath: '',
  locale: undefined,
  locales: undefined,
  defaultLocale: undefined,
  isReady: true,
  isPreview: false,
  events: {
    on: () => {},
    off: () => {},
    emit: () => {}
  }
};

const LanguageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppRouterContext.Provider value={mockRouter as any}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </AppRouterContext.Provider>
  );
};

// Simplificar los mocks para evitar errores de tipos complejos
const mockCurrentRole = {
  _identifier: 'Admin Role',
  _entityName: 'ADRole',
  $ref: 'ADRole/1',
  id: '1',
  client: 'client1',
  client$_identifier: 'Main Client',
  organization: 'org1',
  organization$_identifier: 'Main Organization',
  active: true,
  creationDate: new Date(),
  createdBy: 'user1',
  createdBy$_identifier: 'Admin User',
  updated: new Date(),
  name: 'Admin',
  updatedBy: 'user1',
  updatedBy$_identifier: 'Admin User',
  description: 'Administrator Role',
  userLevel: 'C',
  currency: null,
  approvalAmount: 0,
  primaryTreeMenu: null,
  manual: false,
  processNow: false,
  clientAdmin: true,
  advanced: true,
  isrestrictbackend: false,
  forPortalUsers: false,
  portalAdmin: false,
  isWebServiceEnabled: false,
  template: false,
  recalculatePermissions: null,
  recordTime: 0,
};

const mockCurrentOrganization = {
  _identifier: 'Main Organization',
  _entityName: 'ADOrg',
  $ref: 'ADOrg/1',
  id: '1',
  client: 'client1',
  client$_identifier: 'Main Client',
  active: true,
  creationDate: new Date(),
  createdBy: 'user1',
  createdBy$_identifier: 'Admin User',
  updated: new Date(),
  updatedBy: 'user1',
  updatedBy$_identifier: 'Admin User',
  searchKey: 'MAIN',
  name: 'Main Organization',
  description: null,
  summaryLevel: false,
  organizationType: 'org',
  organizationType$_identifier: 'Organization',
  allowPeriodControl: true,
  calendar: null,
  ready: true,
  socialName: null,
  currency: null,
  generalLedger: null,
  aPRMGlitem: null,
  periodControlAllowedOrganization: '1',
  periodControlAllowedOrganization$_identifier: 'Main Organization',
  calendarOwnerOrganization: '1',
  calendarOwnerOrganization$_identifier: 'Main Organization',
  legalEntityOrganization: '1',
  legalEntityOrganization$_identifier: 'Main Organization',
  inheritedCalendar: 'cal1',
  inheritedCalendar$_identifier: 'Main Calendar',
  businessUnitOrganization: null,
  extbpEnabled: false,
  extbpConfig: null,
  recordTime: 0,
};

const mockCurrentWarehouse = {
  _identifier: 'Main Warehouse',
  _entityName: 'MWarehouse',
  $ref: 'MWarehouse/w1',
  id: 'w1',
  client: 'client1',
  client$_identifier: 'Main Client',
  organization: '1',
  organization$_identifier: 'Main Organization',
  active: true,
  creationDate: new Date(),
  createdBy: 'user1',
  createdBy$_identifier: 'Admin User',
  updated: new Date(),
  updatedBy: 'user1',
  updatedBy$_identifier: 'Admin User',
  searchKey: 'MAIN',
  name: 'Main Warehouse',
  description: null,
  locationAddress: 'addr1',
  locationAddress$_identifier: 'Main Address',
  storageBinSeparator: '-',
  shipmentVehicle: false,
  shipperCode: null,
  fromDocumentNo: null,
  toDocumentNo: null,
  returnlocator: 'loc1',
  returnlocator$_identifier: 'Return Location',
  warehouseRule: null,
  allocated: false,
  recordTime: 0,
};

const mockRoles = [
  {
    id: '1',
    name: 'Admin',
    organizations: [
      {
        id: '1',
        name: 'Main Organization',
        warehouses: [
          { id: 'w1', name: 'Main Warehouse' },
          { id: 'w2', name: 'Secondary Warehouse' }
        ]
      }
    ],
    client: 'Main Client'
  },
  {
    id: '2',
    name: 'User',
    organizations: [
      {
        id: '2',
        name: 'Sales Department',
        warehouses: [
          { id: 'w3', name: 'Sales Warehouse' }
        ]
      }
    ],
    client: 'Main Client'
  }
];

const mockLanguages = [
  { id: '1', language: 'en', name: 'English' },
  { id: '2', language: 'es', name: 'Spanish' },
  { id: '3', language: 'fr', name: 'French' }
];

const mockTranslations = {
  saveAsDefault: 'Save as default'
};

const mockLogger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.log,
  log: console.log,
} as any;

const meta: Meta<typeof ProfileModal> = {
  title: 'Components/ProfileModal',
  component: ProfileModal,
  argTypes: {
    userName: { control: 'text' },
    userEmail: { control: 'text' },
    userPhotoUrl: { control: 'text' },
    section: { control: 'select', options: ['profile', 'password'] },
    saveAsDefault: { control: 'boolean' },
    language: { control: 'select', options: ['en', 'es', 'fr'] },
    languagesFlags: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <LanguageWrapper>
        <div style={{ padding: '20px', minHeight: '600px' }}>
          <Story />
        </div>
      </LanguageWrapper>
    ),
  ],
};

export default meta;

type Story = StoryObj<ProfileModalProps>;

export const ProfileDefault: Story = {
  args: {
    // Base props
    icon: <PersonIcon fill='#2E365C' />,
    userPhotoUrl: profilePicture,
    userName: 'Ayelén García',
    userEmail: 'ayelen.garcia@etendo.software',
    sections: sections,
    section: 'profile',
    translations: mockTranslations,
    
    // Current context
    currentRole: mockCurrentRole,
    currentOrganization: mockCurrentOrganization,
    currentWarehouse: mockCurrentWarehouse,
    
    // Available options
    roles: mockRoles,
    languages: mockLanguages,
    language: 'en',
    languagesFlags: '🇺🇸',
    
    // State
    saveAsDefault: false,
    
    // Required functions
    onSignOff: () => console.log('Sign off clicked'),
    onLanguageChange: (language) => console.log('Language changed to:', language),
    onSaveAsDefaultChange: (event) => console.log('Save as default:', event.target.checked),
    onSetDefaultConfiguration: async (config) => {
      console.log('Setting default configuration:', config);
      return Promise.resolve();
    },
    changeProfile: async (params) => {
      console.log('Changing profile:', params);
      return Promise.resolve();
    },
    logger: mockLogger,
  },
};

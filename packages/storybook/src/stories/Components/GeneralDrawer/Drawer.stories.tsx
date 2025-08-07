import type { Meta, StoryObj } from '@storybook/react';
import DrawerComponent from '@workspaceui/componentlibrary/src/components/Drawer';
import type { SearchContextType, SearchIndex } from '@workspaceui/componentlibrary/src/components/Drawer/types';
import { menuMock } from '../../../../../MainUI/mocks/Drawer/index';
import logoUrl from '@workspaceui/componentlibrary/src/assets/images/logo.svg?url';
import { useState, useMemo } from 'react';

// Mock SearchIndex
const createMockSearchIndex = (): SearchIndex => ({
  byId: new Map(),
  byPhrase: new Map(),
});

const meta: Meta<typeof DrawerComponent> = {
  title: 'Components/Drawer',
  component: DrawerComponent,
  argTypes: {
    logo: { control: 'text' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof DrawerComponent>;

export const Default: Story = {
  render: (args) => {
    const [searchValue, setSearchValue] = useState('');
    const [expandedItems, setExpandedItems] = useState(new Set<string>());
    
    const searchContext: SearchContextType = useMemo(() => ({
      searchValue,
      setSearchValue,
      filteredItems: menuMock,
      expandedItems,
      searchExpandedItems: new Set<string>(),
      setExpandedItems,
      searchIndex: createMockSearchIndex(),
    }), [searchValue, expandedItems]);
    
    return (
      <DrawerComponent 
        {...args} 
        searchContext={searchContext}
      />
    );
  },
  args: {
    items: menuMock,
    logo: logoUrl,
    title: 'Etendo',
    onClick: (item) => console.log(`Navigating to:`, item),
    onReportClick: (item) => console.log(`Report clicked:`, item),
    onProcessClick: (item) => console.log(`Process clicked:`, item),
  },
};

import type React from 'react';
import { useState, useEffect } from 'react';
import { TABS_CONFIG } from './mock';
import SecondaryTabs from '@workspaceui/componentlibrary/src/components/SecondaryTabs';
import type { Meta, StoryObj } from '@storybook/react';
import type { TabContent } from '@workspaceui/componentlibrary/src/components/SecondaryTabs/types';

const meta: Meta<typeof SecondaryTabs> = {
  title: 'Components/SecondaryTabs',
  component: SecondaryTabs,
};

export default meta;

const noop = () => {};

type Story = StoryObj<typeof SecondaryTabs>;

const SecondaryTabsTemplate: React.FC = () => {
  const [tabsContent, setTabsContent] = useState<TabContent[]>(TABS_CONFIG);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedTabs = tabsContent.map((tab) => ({
        ...tab,
        isLoading: false,
      }));
      setTabsContent(updatedTabs);
    }, 5000);
    return () => clearTimeout(timer);
  }, [tabsContent]);

  return <SecondaryTabs content={tabsContent} selectedTab={0} onChange={noop} />;
};

export const Default: Story = {
  render: () => <SecondaryTabsTemplate />,
};

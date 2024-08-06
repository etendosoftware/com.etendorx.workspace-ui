import React, { useState, useEffect } from 'react';
import { TABS_CONFIG } from './mock';
import SecondaryTabs from '../../../../../ComponentLibrary/src/components/SecondaryTabs';
import type { Meta, StoryObj } from '@storybook/react';

type TabContent = {
  icon: React.ReactElement | string;
  label: string;
  numberOfItems: number;
  isLoading?: boolean;
  onClick: () => void;
  content: React.ReactElement;
};

const meta: Meta<typeof SecondaryTabs> = {
  title: 'Components/SecondaryTabs',
  component: SecondaryTabs,
};

export default meta;

type Story = StoryObj<typeof SecondaryTabs>;

const SecondaryTabsTemplate: React.FC = () => {
  const [tabsContent, setTabsContent] = useState<TabContent[]>(TABS_CONFIG);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedTabs = tabsContent.map(tab => ({
        ...tab,
        isLoading: false,
      }));
      setTabsContent(updatedTabs);
    }, 5000);
    return () => clearTimeout(timer);
  }, [tabsContent]);

  return <SecondaryTabs tabsContent={tabsContent} />;
};

export const Default: Story = {
  render: () => <SecondaryTabsTemplate />,
};

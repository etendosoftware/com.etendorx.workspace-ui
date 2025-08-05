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

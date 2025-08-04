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

import type { Meta, StoryObj } from '@storybook/react';
import Breadcrumb from '@workspaceui/componentlibrary/src/components/Breadcrums';
import { mockDefaultActions, mockDefaultArgs } from './mock';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  argTypes: {
    onHomeClick: { action: 'Home clicked' },
    homeIcon: { control: 'text' },
    homeText: { control: 'text' },
    separator: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: mockDefaultArgs,
};

export const CustomHomeIcon: Story = {
  args: {
    ...mockDefaultArgs,
    homeIcon: '🏠',
  },
};

export const CustomHomeText: Story = {
  args: {
    ...mockDefaultArgs,
    homeText: 'Custom text',
  },
};

export const SingleLevel: Story = {
  args: {
    ...mockDefaultArgs,
    items: [{ id: '1', label: 'Single Item', actions: mockDefaultActions }],
  },
};

export const TwoLevels: Story = {
  args: {
    ...mockDefaultArgs,
    items: [
      { id: '1', label: 'Two' },
      { id: '2', label: 'Items', actions: mockDefaultActions },
    ],
  },
};

export const Empty: Story = {
  args: {
    ...mockDefaultArgs,
    items: [],
  },
};

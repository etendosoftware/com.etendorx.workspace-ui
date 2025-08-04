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
import DrawerComponent from '@workspaceui/componentlibrary/src/components/Drawer';
import { menuMock } from '../../../../../MainUI/mocks/Drawer/index';
import logoUrl from '@workspaceui/componentlibrary/src/assets/images/logo.svg?url';

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
  args: {
    items: menuMock,
    logo: logoUrl,
    title: 'Etendo',
    onClick: (pathname: string) => console.log(`Navigating to: ${pathname}`),
  },
};

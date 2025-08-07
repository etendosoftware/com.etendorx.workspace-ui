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

import WaterfallModal from '@workspaceui/componentlibrary/src/components/Waterfall/WaterfallModal';
import type { WaterfallModalProps } from '@workspaceui/componentlibrary/src/components/Waterfall/types';
import { initialPeople, menuItems } from '../mock';
import AddIcon from '@workspaceui/componentlibrary/src/assets/icons/plus.svg';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WaterfallModal> = {
  title: 'Components/WaterfallModal',
  component: WaterfallModal,
  argTypes: {
    backButtonText: { control: 'text' },
    activateAllText: { control: 'text' },
    deactivateAllText: { control: 'text' },
    buttonText: { control: 'text' },
    customizeText: { control: 'text' },
    tooltipWaterfallButton: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<WaterfallModalProps>;

export const DefaultWaterfallModal: Story = {
  render: (args) => <WaterfallModal {...args} />,
  args: {
    menuItems,
    initialPeople,
    backButtonText: 'Back',
    activateAllText: 'Activate all',
    deactivateAllText: 'Deactivate all',
    buttonText: 'Buttons',
    customizeText: 'Customize',
    tooltipWaterfallButton: 'Waterfall',
    icon: <AddIcon />,
  },
};

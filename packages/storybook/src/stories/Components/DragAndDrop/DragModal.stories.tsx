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

import DragModal from '@workspaceui/componentlibrary/src/components/DragModal/DragModal';
import { initialPeople } from '../mock';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DragModal> = {
  title: 'Components/DragModal',
  component: DragModal,
  argTypes: {
    backButtonText: { control: 'text' },
    activateAllText: { control: 'text' },
    deactivateAllText: { control: 'text' },
    buttonText: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof DragModal>;

export const Default: Story = {
  args: {
    initialPeople,
    onBack: () => console.log('Back clicked'),
    onClose: () => console.log('Close clicked'),
    backButtonText: 'Back',
    activateAllText: 'Activate all',
    deactivateAllText: 'Deactivate all',
    buttonText: 'Buttons',
  },
};

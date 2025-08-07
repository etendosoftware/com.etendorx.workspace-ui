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

import StatusModal from '@workspaceui/componentlibrary/src/components/StatusModal';
import type { StatusType } from '@workspaceui/componentlibrary/src/components/StatusModal/types';
import type { Meta, StoryObj } from '@storybook/react';

interface StatusModalStoryProps {
  statusText: string;
  statusType: StatusType;
  errorMessage?: string;
  saveLabel: string;
  secondaryButtonLabel: string;
}

const meta: Meta<typeof StatusModal> = {
  title: 'Components/StatusModal',
  component: StatusModal,
  argTypes: {
    statusText: { control: 'text' },
    statusType: {
      control: 'select',
      options: ['success', 'error', 'warning'],
    },
    saveLabel: { control: 'text' },
    secondaryButtonLabel: { control: 'text' },
    errorMessage: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<StatusModalStoryProps>;

const StatusModalTemplate: Story = {
  render: (args) => <StatusModal {...args} />,
};

export const SuccessStatus: Story = {
  ...StatusModalTemplate,
  args: {
    statusText: 'Operation completed successfully',
    statusType: 'success',
    saveLabel: 'Save',
    secondaryButtonLabel: 'Cancel',
  },
};

export const ErrorStatus: Story = {
  ...StatusModalTemplate,
  args: {
    statusText: 'An error occurred',
    statusType: 'error',
    errorMessage: 'Unable to complete the operation. Please try again later.',
  },
};

export const WarningStatus: Story = {
  ...StatusModalTemplate,
  args: {
    statusText: 'Warning: Action required',
    statusType: 'warning',
  },
};

export const CustomErrorMessage: Story = {
  ...StatusModalTemplate,
  args: {
    statusText: 'Custom Error',
    statusType: 'error',
    errorMessage: 'This is a custom error message that can be quite long and detailed if needed.',
  },
};

export const LongStatusText: Story = {
  ...StatusModalTemplate,
  args: {
    statusText:
      'This is a very long status text to demonstrate how the modal handles extensive content in the status message area.',
    statusType: 'success',
  },
};

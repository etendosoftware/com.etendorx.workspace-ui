import StatusModal from '@workspaceui/componentlibrary/src/components/StatusModal';
import { StatusType } from '@workspaceui/componentlibrary/src/components/StatusModal/types';
import type { Meta, StoryObj } from '@storybook/react';

interface StatusModalStoryProps {
  statusText: string;
  statusType: StatusType;
  errorMessage?: string;
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
    errorMessage: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<StatusModalStoryProps>;

const StatusModalTemplate: Story = {
  render: args => <StatusModal {...args} />,
};

export const SuccessStatus: Story = {
  ...StatusModalTemplate,
  args: {
    statusText: 'Operation completed successfully',
    statusType: 'success',
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

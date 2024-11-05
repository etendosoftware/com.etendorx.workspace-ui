import type { Meta, StoryObj } from '@storybook/react';
import RegisterModal from '@workspaceui/componentlibrary/src/components/RegisterModal';

const meta: Meta<typeof RegisterModal> = {
  title: 'Components/RegisterModal',
  component: RegisterModal,
  argTypes: {
    registerText: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof RegisterModal>;

export const Default: Story = {
  args: {
    registerText: 'Register',
  },
};

export const WithCustomLabels: Story = {
  args: {
    ...Default.args,
    registerText: 'Registration',
  },
};

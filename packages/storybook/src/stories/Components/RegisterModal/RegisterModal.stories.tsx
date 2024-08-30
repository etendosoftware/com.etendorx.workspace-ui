import type { Meta, StoryObj } from '@storybook/react';
import RegisterModal from '../../../../../ComponentLibrary/src/components/RegisterModal';

const meta: Meta<typeof RegisterModal> = {
  title: 'Components/RegisterModal',
  component: RegisterModal,
  argTypes: {
    cancelButtonLabel: { control: 'text' },
    saveButtonLabel: { control: 'text' },
    registerText: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof RegisterModal>;

export const Default: Story = {
  args: {
    cancelButtonLabel: 'Cancel',
    saveButtonLabel: 'Save',
    registerText: 'Register',
  },
};

export const WithCustomLabels: Story = {
  args: {
    ...Default.args,
    cancelButtonLabel: 'Go Back',
    saveButtonLabel: 'Confirm',
    registerText: 'Registration',
  },
};

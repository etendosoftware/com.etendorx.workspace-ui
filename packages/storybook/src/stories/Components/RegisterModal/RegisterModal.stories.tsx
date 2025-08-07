import type { Meta, StoryObj } from '@storybook/react';
import RegisterModal from '@workspaceui/componentlibrary/src/components/RegisterModal';
import { FormProvider, useForm } from 'react-hook-form';
import { fn } from '@storybook/test';

const meta: Meta<typeof RegisterModal> = {
  title: 'Components/RegisterModal',
  component: RegisterModal,
  argTypes: {
    registerText: { control: 'text' },
  },
  decorators: [
    (Story) => {
      const methods = useForm();
      return (
        <FormProvider {...methods}>
          <Story />
        </FormProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof RegisterModal>;

export const Default: Story = {
  args: {
    registerText: 'Register',
    translations: {
      register: 'Register',
      descriptionText: 'Select an option',
      save: 'Save',
      cancel: 'Cancel',
    },
    onClick: fn(),
  },
};

export const WithCustomLabels: Story = {
  args: {
    ...Default.args,
    registerText: 'Registration',
    translations: {
      register: 'Registrar',
      descriptionText: 'Seleccione una opción',
      save: 'Guardar',
      cancel: 'Cancelar',
    },
  },
};

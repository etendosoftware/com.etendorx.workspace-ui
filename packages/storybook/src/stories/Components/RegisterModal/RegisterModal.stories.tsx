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

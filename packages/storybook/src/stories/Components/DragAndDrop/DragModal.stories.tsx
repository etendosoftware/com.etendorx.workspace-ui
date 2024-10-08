import DragModal from '../../../../../ComponentLibrary/src/components/DragModal/DragModal';
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

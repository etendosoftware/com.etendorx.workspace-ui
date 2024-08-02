import WaterfallModal from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal';
import { WaterfallModalProps } from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.types';
import { initialPeople, menuItems } from '../mock';
import AddIcon from '../../../../../ComponentLibrary/src/assets/icons/plus.svg';
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
  render: args => <WaterfallModal {...args} />,
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

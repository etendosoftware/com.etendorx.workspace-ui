import WaterfallModal from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal';
import { WaterfallModalProps } from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.types';
import { initialPeople, menuItems } from '../mock';

export default {
  title: 'Components/WaterfallModal',
  component: WaterfallModal,
  argTypes: {
    backButtonText: { control: 'text' },
    activateAllText: { control: 'text' },
    deactivateAllText: { control: 'text' },
    buttonText: { control: 'text' },
    customizeText: { control: 'text' },
    tooltipWaterfallProfile: { control: 'text' },
  },
};

const Template = (args: WaterfallModalProps) => <WaterfallModal {...args} />;

export const DefaultWaterfallModal = Template.bind({});
DefaultWaterfallModal.args = {
  menuItems,
  initialPeople,
  backButtonText: 'Back',
  activateAllText: 'Activate all',
  deactivateAllText: 'Deactivate all',
  buttonText: 'Buttons',
  customizeText: 'Customize',
  tooltipWaterfallProfile: 'Waterfall'
};

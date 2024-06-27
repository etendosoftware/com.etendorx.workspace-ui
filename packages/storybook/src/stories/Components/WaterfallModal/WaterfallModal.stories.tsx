import WaterfallModal from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal';
import { WaterfallModalProps } from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.types';
import { initialPeople, menuItems } from '../mock';

export default {
  title: 'Components/WaterfallModal',
  component: WaterfallModal,
};

const Template = (args: WaterfallModalProps) => <WaterfallModal {...args} />;

export const DefaultWaterfallModal = Template.bind({});
DefaultWaterfallModal.args = {
  menuItems,
  initialPeople,
};

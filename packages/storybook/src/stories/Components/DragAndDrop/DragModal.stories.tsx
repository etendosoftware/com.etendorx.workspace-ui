import DragModal from '../../../../../ComponentLibrary/src/components/DragModal/DragModal';
import { DragModalProps } from '../../../../../ComponentLibrary/src/components/DragModal/DragModal.types';
import { initialPeople } from '../mock';

export default {
  title: 'Components/DragModal',
  component: DragModal,
  argTypes: {
    backButtonText: { control: 'text' },
    activateAllText: { control: 'text' },
    deactivateAllText: { control: 'text' },
    buttonText: { control: 'text' },
  },
};

const Template = (args: DragModalProps) => <DragModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  initialPeople,
  onBack: () => console.log('Back clicked'),
  onClose: () => console.log('Close clicked'),
  backButtonText: 'Back',
  activateAllText: 'Activate all',
  deactivateAllText: 'Deactivate all',
  buttonText: 'Buttons',
};

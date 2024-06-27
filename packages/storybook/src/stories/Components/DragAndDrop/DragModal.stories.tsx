import DragModal from '../../../../../ComponentLibrary/src/components/DragModal/DragModal';
import { DragModalProps } from '../../../../../ComponentLibrary/src/components/DragModal/DragModal.types';
import { initialPeople } from '../mock';

export default {
  title: 'Components/DragModal',
  component: DragModal,
};

const Template = (args: DragModalProps) => <DragModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  initialPeople,
  onBack: () => console.log('Volver clicked'),
};

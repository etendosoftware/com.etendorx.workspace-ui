import ProfileModal from '../../../../../ComponentLibrary/src/components/ProfileModal/ProfileModal';

export default {
  title: 'Components/ProfileModal',
  component: ProfileModal,
  argTypes: {
    cancelButtonText: { control: 'text' },
    saveButtonText: { control: 'text' },
  },
};

const Template = args => <ProfileModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  cancelButtonText: 'Cancelar',
  saveButtonText: 'Guardar',
};

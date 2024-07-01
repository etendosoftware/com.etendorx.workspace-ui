import ProfileModal from '../../../../../ComponentLibrary/src/components/ProfileModal/ProfileModal';

export default {
  title: 'Components/ProfileModal',
  component: ProfileModal,
  argTypes: {
    cancelButtonText: { control: 'text' },
    saveButtonText: { control: 'text' },
    passwordLabel: { control: 'text' },
    newPasswordLabel: { control: 'text' },
    confirmPasswordLabel: { control: 'text' },
    section: { control: 'text' },
  },
};

const Template = args => <ProfileModal {...args} />;

export const ProfileDefault = Template.bind({});
ProfileDefault.args = {
  section: 'profile',
  cancelButtonText: 'Cancel',
  saveButtonText: 'Save',
  passwordLabel: 'Password',
  newPasswordLabel: 'New Password',
  confirmPasswordLabel: 'Confirm New Password',
};

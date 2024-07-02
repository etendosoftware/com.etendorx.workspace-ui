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
<<<<<<< HEAD
    tooltipButtonProfile: { control: 'text' },
=======
    tooltipModal: { control: 'text' },
>>>>>>> 6546670 (Feature EPL-1493: Fix conflicts)
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
<<<<<<< HEAD
  tooltipButtonProfile: 'Account Settings',
=======
  tooltipModal: 'Account Settings',
>>>>>>> 6546670 (Feature EPL-1493: Fix conflicts)
};

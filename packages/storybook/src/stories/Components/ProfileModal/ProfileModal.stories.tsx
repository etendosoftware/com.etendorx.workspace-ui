import ProfileModal from '../../../../../ComponentLibrary/src/components/ProfileModal/ProfileModal';
import profilePicture from '../.././../../../ComponentLibrary/src/assets/images/profile_picture_mock.png';
import PersonIcon from '../../../../../ComponentLibrary/src/assets/icons/user.svg';

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
    tooltipButtonProfile: { control: 'text' },
    userPhotoUrl: { control: 'text' },
    userName: { control: 'text' },
    userEmail: { control: 'text' },
    icon: { control: 'object' },
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
  tooltipButtonProfile: 'Account Settings',
  userPhotoUrl: profilePicture,
  userName: 'Ayelén García',
  userEmail: 'ayelen.garcia@etendo.software',
  icon: <PersonIcon fill="#2E365C" />,
};

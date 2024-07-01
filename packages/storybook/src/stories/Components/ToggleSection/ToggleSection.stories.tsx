import SelectorList from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleSection';
import { SelectorListProps } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleSection/types';

export default {
  title: 'Components/Sections',
  component: SelectorList,
  argTypes: {
    section: { control: 'text' },
    passwordLabel: { control: 'text' },
    newPasswordLabel: { control: 'text' },
    confirmPasswordLabel: { control: 'text' },
  },
};

const Template = (args: SelectorListProps) => <SelectorList {...args} />;

export const PasswordSection = Template.bind({});
PasswordSection.args = {
  section: 'password',
  passwordLabel: 'Password',
  newPasswordLabel: 'New Password',
  confirmPasswordLabel: 'Confirm New Password',
};

export const ProfileSection = Template.bind({});
ProfileSection.args = {
  section: 'profile',
  passwordLabel: '',
  newPasswordLabel: '',
  confirmPasswordLabel: '',
};

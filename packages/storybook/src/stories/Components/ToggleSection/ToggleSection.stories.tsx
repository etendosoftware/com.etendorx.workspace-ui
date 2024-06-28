import { useState } from 'react';
import { Meta } from '@storybook/react';
import SelectorList from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleSection';
import { sectionsMock } from './mock';
import ToggleSections from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton';

export default {
  title: 'Components/SelectorList',
  component: SelectorList,
  argTypes: {
    section: {
      control: {
        type: 'select',
        options: ['profile', 'password'],
      },
    },
  },
} as Meta;

const Template = args => {
  const [currentSection, setCurrentSection] = useState<string>('profile');

  const handleToggle = (section: string) => {
    setCurrentSection(section);
  };

  return (
    <>
      <ToggleSections
        sections={sectionsMock}
        currentSection={currentSection}
        onToggle={handleToggle}
      />
      <SelectorList {...args} section={currentSection} />
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  section: 'profile',
};

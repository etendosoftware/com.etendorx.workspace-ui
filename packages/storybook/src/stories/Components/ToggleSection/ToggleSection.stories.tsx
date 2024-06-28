import { useState } from 'react';
import ToggleSections from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleSection/ToggleSection';
import { sectionsMock, sectionsMock3, sectionsMock4 } from './mock';

export default {
  title: 'Components/ToggleSections',
  component: ToggleSections,
  argTypes: {
    sections: { control: false },
    currentSection: { control: 'text' },
    onToggle: { action: 'toggled' },
  },
};

const Template = args => {
  const [currentSection, setCurrentSection] = useState(args.currentSection);

  const handleToggle = (section: string) => {
    setCurrentSection(section);
    args.onToggle(section);
  };

  return (
    <ToggleSections
      {...args}
      currentSection={currentSection}
      onToggle={handleToggle}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  sections: sectionsMock,
  currentSection: 'profile',
};

export const ThreeSections = Template.bind({});
ThreeSections.args = {
  sections: sectionsMock3,
  currentSection: 'profile',
};

export const FourSections = Template.bind({});
FourSections.args = {
  sections: sectionsMock4,
  currentSection: 'profile',
};

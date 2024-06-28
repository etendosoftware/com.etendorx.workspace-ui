import { useState } from 'react';
import ToggleButton from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton';
import { sectionsMock, sectionsMock3, sectionsMock4 } from './mock';

export default {
  title: 'Components/ToggleButton',
  component: ToggleButton,
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
    <ToggleButton
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

export const TripleButton = Template.bind({});
TripleButton.args = {
  sections: sectionsMock3,
  currentSection: 'profile',
};

export const QuadButton = Template.bind({});
QuadButton.args = {
  sections: sectionsMock4,
  currentSection: 'profile',
};

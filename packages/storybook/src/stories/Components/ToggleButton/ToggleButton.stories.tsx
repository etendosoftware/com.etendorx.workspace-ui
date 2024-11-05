import React, { useState } from 'react';
import ToggleButton from '@workspaceui/componentlibrary/src/components/ProfileModal/ToggleButton';
import { sectionsMock, sectionsMock3, sectionsMock4 } from './mock';
import type { Meta, StoryObj } from '@storybook/react';
import { Section } from '@workspaceui/componentlibrary/src/components/ProfileModal/ToggleButton/types';

interface ToggleButtonProps {
  sections: Section[];
  currentSection: string;
  onToggle: (section: string) => void;
}

const meta: Meta<typeof ToggleButton> = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
  argTypes: {
    sections: { control: false },
    currentSection: { control: 'text' },
    onToggle: { action: 'toggled' },
  },
};

export default meta;

type Story = StoryObj<ToggleButtonProps>;

const ToggleButtonTemplate: React.FC<ToggleButtonProps> = args => {
  const [currentSection, setCurrentSection] = useState(args.currentSection);

  const handleToggle = (section: string) => {
    setCurrentSection(section);
    args.onToggle(section);
  };

  return <ToggleButton {...args} currentSection={currentSection} onToggle={handleToggle} />;
};

export const Default: Story = {
  render: args => <ToggleButtonTemplate {...args} />,
  args: {
    sections: sectionsMock,
    currentSection: 'profile',
    onToggle: (section: string) => console.log('Toggled to:', section),
  },
};

export const TripleButton: Story = {
  render: args => <ToggleButtonTemplate {...args} />,
  args: {
    sections: sectionsMock3,
    currentSection: 'profile',
    onToggle: (section: string) => console.log('Toggled to:', section),
  },
};

export const QuadButton: Story = {
  render: args => <ToggleButtonTemplate {...args} />,
  args: {
    sections: sectionsMock4,
    currentSection: 'profile',
    onToggle: (section: string) => console.log('Toggled to:', section),
  },
};

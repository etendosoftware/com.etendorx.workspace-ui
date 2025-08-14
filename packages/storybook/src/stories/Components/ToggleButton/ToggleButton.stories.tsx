/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type React from 'react';
import { useState } from 'react';
import ToggleButton from '@/components/ProfileModal/ToggleButton';
import { sectionsMock, sectionsMock3, sectionsMock4 } from './mock';
import type { Meta, StoryObj } from '@storybook/react';
import type { Section } from '@/components/ProfileModal/ToggleButton/types';

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

const ToggleButtonTemplate: React.FC<ToggleButtonProps> = (args) => {
  const [currentSection, setCurrentSection] = useState(args.currentSection);

  const handleToggle = (section: string) => {
    setCurrentSection(section);
    args.onToggle(section);
  };

  return <ToggleButton {...args} currentSection={currentSection} onToggle={handleToggle} />;
};

export const Default: Story = {
  render: (args) => <ToggleButtonTemplate {...args} />,
  args: {
    sections: sectionsMock,
    currentSection: 'profile',
    onToggle: (section: string) => console.log('Toggled to:', section),
  },
};

export const TripleButton: Story = {
  render: (args) => <ToggleButtonTemplate {...args} />,
  args: {
    sections: sectionsMock3,
    currentSection: 'profile',
    onToggle: (section: string) => console.log('Toggled to:', section),
  },
};

export const QuadButton: Story = {
  render: (args) => <ToggleButtonTemplate {...args} />,
  args: {
    sections: sectionsMock4,
    currentSection: 'profile',
    onToggle: (section: string) => console.log('Toggled to:', section),
  },
};

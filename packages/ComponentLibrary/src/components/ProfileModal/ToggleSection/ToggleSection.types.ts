import React from 'react';

export interface Section {
  id: string;
  label: string;
  icon: React.ReactElement;
}

export interface ToggleSectionsProps {
  sections: Section[];
  currentSection: string;
  onToggle: (section: string) => void;
}

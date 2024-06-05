export interface Section<T extends string> {
  id: T;
  label: string;
  icon: React.ReactElement;
}

export interface ToggleSectionsProps<T extends string> {
  sections: Section<T>[];
  currentSection: T;
  onToggle: (section: T) => void;
}

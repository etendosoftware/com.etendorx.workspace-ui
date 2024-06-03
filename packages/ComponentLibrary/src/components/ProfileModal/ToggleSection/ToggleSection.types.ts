export interface ToggleSectionProps {
    section: 'profile' | 'password';
    onToggle: (section: 'profile' | 'password') => void;
  }
  
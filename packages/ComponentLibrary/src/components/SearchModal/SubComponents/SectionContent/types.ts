import { Section } from '../../types';

export interface SectionContentProps {
  section: Section;
  isLast: boolean;
  variant: 'default' | 'tabs';
}

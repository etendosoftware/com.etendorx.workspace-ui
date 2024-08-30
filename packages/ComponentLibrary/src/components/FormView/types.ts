import { Organization } from '../../../../storybook/src/stories/Components/Table/types';
import {
  FieldDefinition,
  Section,
} from '../../../../storybook/src/stories/Components/Table/types';

export interface FormViewProps {
  data: Organization;
  onSave: () => void;
  onCancel: () => void;
}

export interface FormSectionProps {
  sectionName: string;
  sectionData: Section;
  fields: [string, FieldDefinition][];
  isExpanded: boolean;
  onAccordionChange: (sectionId: string, isExpanded: boolean) => void;
  onHover: (sectionName: string | null) => void;
  hoveredSection: string | null;
  onInputChange: (
    name: string,
    value: string | number | boolean | string[] | Date,
  ) => void;
  sectionRef: React.Ref<HTMLDivElement>;
}

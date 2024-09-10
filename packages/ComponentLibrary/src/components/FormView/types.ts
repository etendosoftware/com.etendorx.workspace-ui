import { ReactNode } from 'react';
import {
  FieldDefinition,
  Organization,
  Section,
} from '../../../../storybook/src/stories/Components/Table/types';

export interface GridItemProps {
  xs?: number;
  sm?: number;
  md?: number;
}

export interface FormViewProps {
  data: Organization;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  gridItemProps?: GridItemProps;
  dottedLineInterval?: number;
  onChange?: (updatedData: Organization) => void;
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
  gridItemProps?: GridItemProps;
  dottedLineInterval?: number;
  readOnly?: boolean;
  children?: ReactNode;
}

export type FieldValue = FieldDefinition['value'];

export interface FormFieldProps {
  name: string;
  field: FieldDefinition;
  onChange: (name: string, value: FieldDefinition['value']) => void;
  readOnly?: boolean;
}

export interface FormFieldGroupProps extends FormFieldProps {
  readOnly: boolean;
}

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  readOnly?: boolean;
}

export interface SectionRendererProps
  extends Omit<FormSectionProps, 'children'> {
  sectionRef: (el: HTMLElement | null) => void;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  color: string;
}

export interface NoteSectionProps {
  sectionId: string;
  addNoteButtonText: string | undefined;
  modalTitleText: string | undefined;
  modalDescriptionText: string | undefined;
  noteInputPlaceholder: string | undefined;
  addNoteSubmitText: string | undefined;
}

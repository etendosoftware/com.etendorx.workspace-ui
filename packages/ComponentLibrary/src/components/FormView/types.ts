import { ReactNode } from 'react';
import { Field, MappedData, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';

export interface GridItemProps {
  xs?: number;
  sm?: number;
  md?: number;
}

export interface Section {
  name: string;
  label: string;
  type: 'section';
  personalizable: boolean;
  icon?: React.ReactNode;
  id: string;
  fill?: string;
  hoverFill?: string;
  showInTab: 'icon' | 'label' | 'both';
}

export type FormData = Record<string, FieldDefinition | Section>;

export interface FormViewProps {
  data: FormData;
  windowMetadata?: MappedData;
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  gridItemProps?: GridItemProps;
  dottedLineInterval?: number;
  onChange?: (updatedData: FormData) => void;
  initialValues?: boolean;
}

export interface FormSectionProps {
  sectionName: string;
  sectionData: Section;
  fields: [string, FieldDefinition][];
  isExpanded: boolean;
  onAccordionChange: (sectionId: string, isExpanded: boolean) => void;
  onHover: (sectionName: string | null) => void;
  hoveredSection: string | null;
  onInputChange: (name: string, value: FieldValue) => void;
  sectionRef: React.Ref<HTMLDivElement>;
  gridItemProps?: GridItemProps;
  dottedLineInterval?: number;
  readOnly?: boolean;
  renderFieldValue?: (field: FieldDefinition) => FieldValue;
  children?: ReactNode;
}

export type FieldValue = string | number | boolean | string[] | Date | null | FieldDefinition['value'];

export interface FormFieldGroupProps {
  name?: string;
  field: FieldDefinition;
  onChange: (name: string, value: FieldValue) => void;
  entityName?: string;
  accessor?: string;
  windowMetadata?: WindowMetadata;
  readOnly?: boolean;
  renderFieldValue?: (field: FieldDefinition) => FieldValue;
}

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  readOnly?: boolean;
  fieldType: string;
  onLinkClick?: () => void;
  isEntityReference?: boolean;
}

export interface SectionRendererProps extends Omit<FormSectionProps, 'children'> {
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

// TableDir Selector
export interface TableDirSelectorProps {
  label: string;
  value: FieldValue;
  entity: string;
  onChange: (name: string, value: string) => void;
}

export interface SearchSelectorProps {
  label: string;
  value: FieldValue;
  entity: string;
  onChange: (name: string, value: string) => void;
  field: FieldDefinition;
}

export interface Option {
  id: string;
  title: string;
  value: string;
}

export interface GenericSelectorProps {
  field: Field;
}

export interface BooleanSelectorProps {
  label: string;
  readOnly?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface NumberSelectorProps {
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  readOnly?: boolean;
}

export interface DateSelectorProps {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  readOnly?: boolean;
}

export interface SelectSelectorProps {
  name: string;
  title: string;
  onChange: (name: string, value: string) => void;
  readOnly?: boolean;
}

export interface QuantityProps {
  value: FieldValue;
  maxLength?: string;
  min?: number | string | null;
  max?: number | string | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export interface ListSelectorProps {
  field: FieldDefinition;
  onChange: (name: string, value: string) => void;
  readOnly?: boolean;
}

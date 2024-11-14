import { ReactNode } from 'react';
import { MappedData, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';

export interface FieldInfo {
  fieldGroup$_identifier?: string;
}

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'tabledir' | 'quantity' | 'list';

export interface BaseFieldDefinition<T> {
  value: T;
  type: FieldType;
  initialValue?: T;
  label: string;
  name: string;
  section?: string;
  required?: boolean;
  original?: {
    refList: Array<{ id: string; label: string; value: string }>;
    referencedEntity: string;
    referencedWindowId: string;
    referencedTabId: string;
    fieldName: string;
  } & Field;
}
export type FieldDefinition =
  | BaseFieldDefinition<string>
  | BaseFieldDefinition<number>
  | BaseFieldDefinition<boolean>
  | BaseFieldDefinition<Date>
  | BaseFieldDefinition<string[]>;

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
  renderFieldValue?: (field: FieldDefinition) => any;
  children?: ReactNode;
}

export type FieldValue = string | number | boolean | string[] | Date | null;

export interface FormFieldGroupProps {
  name: string;
  field: FieldDefinition;
  onChange: (name: string, value: FieldValue) => void;
  entityName?: string;
  accessor?: string;
  windowMetadata?: WindowMetadata;
  readOnly?: boolean;
  renderFieldValue?: (field: FieldDefinition) => any;
}

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  readOnly?: boolean;
  fieldType: string;
  onLinkClick?: () => void;
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

export interface Option {
  id: string;
  title: string;
  value: string;
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

import { Field, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';
import { ReportColumn } from '@workspaceui/etendohookbinder/src/hooks/types';
import { MRT_ColumnDef, MRT_Row } from 'material-react-table';

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
  onSave: () => void;
  onCancel: () => void;
  readOnly?: boolean;
  gridItemProps?: GridItemProps;
  dottedLineInterval?: number;
  onChange?: (updatedData: FormData) => void;
  initialValues?: boolean;
  onLabelClick?: (url: string) => void;
  tab: Tab;
  sessionAttributes?: Record<string, unknown>;
  auxiliaryInputValues?: Record<string, unknown>;
}

export interface FormSectionProps {
  sectionName: string;
  sectionData: Section;
  fields: [string, FieldDefinition][];
  isExpanded: boolean;
  onAccordionChange: (sectionId: string, isExpanded: boolean) => void;
  onHover: (sectionName: string | null) => void;
  hoveredSection: string | null;
  sectionRef: React.Ref<HTMLDivElement>;
  gridItemProps?: GridItemProps;
  dottedLineInterval?: number;
  readOnly?: boolean;
  children?: React.ReactNode;
  onLabelClick?: FormViewProps['onLabelClick'];
  tab: Tab;
}

export type FieldValue = string | number | boolean | string[] | Date | null | FieldDefinition['value'];

export interface FormFieldGroupProps {
  tab: Tab;
  name?: string;
  field: FieldDefinition;
  entityName?: string;
  accessor?: string;
  windowMetadata?: WindowMetadata;
  readOnly?: boolean;
  renderFieldValue?: (field: FieldDefinition) => FieldValue;
  onLabelClick?: FormSectionProps['onLabelClick'];
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
  name: string;
  onChange: (value: string) => void;
  disabled: boolean;
  readOnly: boolean;
}

export interface SearchSelectorProps {
  label: string;
  value: FieldValue;
  entity: string;
  onChange: (value: string) => void;
  field: FieldDefinition;
  name: string;
  disabled: boolean;
  readOnly: boolean;
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
  name: string;
  onChange: (name: string, value: boolean) => void;
  disabled: boolean;
}

export interface NumberSelectorProps {
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
  readOnly?: boolean;
}

export interface DateSelectorProps {
  label?: string;
  name: string;
  value?: string;
  onChange: (event: unknown) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

export interface SelectSelectorProps {
  name: string;
  title: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  field: Field;
  value: string;
}

export interface DatabaseSelectSelector {
  name: string;
  title: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  value: string;
  entity: string;
}

export interface QuantityProps {
  value: FieldValue;
  maxLength?: string;
  min?: number | string | null;
  max?: number | string | null;
  onChange?: (value: number) => void;
  name: string;
  readOnly?: boolean;
}

export interface ListSelectorProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  name: string;
  readOnly?: boolean;
}

//MultiSelect
export interface MultiSelectProps {
  value?: string | string[];
  onChange: (value: string[]) => void;
  readOnly?: boolean;
  title?: string;
  entity: string;
  columnName: string;
  identifierField: string;
  columns?: ReportColumn[];
}

export type TableData = Record<string, unknown>;

export interface SelectorTableProps {
  data: TableData[];
  onRowClick: (row: MRT_Row<TableData>) => void;
  columns: MRT_ColumnDef<TableData>[];
  title: string;
}

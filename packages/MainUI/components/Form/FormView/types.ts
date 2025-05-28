import { Field, FormMode, Tab, WindowMetadata } from '@workspaceui/etendohookbinder/src/api/types';
import { FieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';
import { ReportColumn } from '@workspaceui/etendohookbinder/src/hooks/types';
import { MRT_ColumnDef, MRT_Row } from 'material-react-table';

export interface GridItemProps {
  xs?: number;
  sm?: number;
  md?: number;
}

export interface CollapsibleProps {
  title: string;
  icon?: React.ReactNode;
  isExpanded?: boolean;
  sectionId?: string;
  onToggle?: (isOpen: boolean) => void;
  children: React.ReactNode;
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
  window?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  recordId?: string;
  onSave?: (saveFn: () => void) => void;
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
}

export type FieldValue = string | number | boolean | string[] | Date | null | FieldDefinition['value'];

export interface FieldLabelProps {
  label: string;
  required?: boolean;
  readOnly?: boolean;
  fieldType: string;
  onLinkClick?: () => void;
  isEntityReference?: boolean;
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
  disabled?: boolean;
  isReadOnly?: boolean;
}

export interface SearchSelectorProps {
  label: string;
  value: FieldValue;
  entity: string;
  onChange: (value: string) => void;
  field: Field;
  name: string;
  disabled?: boolean;
  readOnly?: boolean;
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
  disabled?: boolean;
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
  field: Field;
}

export interface ListSelectorProps {
  field: Field;
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

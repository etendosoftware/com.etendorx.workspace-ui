export interface FieldInfo {
  fieldGroup$_identifier?: string;
}

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export interface FieldDefinition {
  value: string | number | boolean | Date | string[];
  type: FieldType;
  label: string;
  section: string;
  required: boolean;
}

export interface Section {
  name: string;
  label: string;
  type: 'section';
  personalizable: boolean;
  id: string;
  showInTab: 'both';
}

export type FormData = Record<string, FieldDefinition | Section>;

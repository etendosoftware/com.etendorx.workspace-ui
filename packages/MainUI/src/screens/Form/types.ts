import { Field } from '@workspaceui/etendohookbinder/src/api/types';

export interface FieldInfo {
  fieldGroup$_identifier?: string;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'tabledir';

export interface BaseFieldDefinition<T> {
  value: T;
  type: FieldType;
  label: string;
  name: string;
  section?: string;
  required?: boolean;
  original: {
    referencedEntity: string;
    fieldName: string;
  } & Field;
}
export type FieldDefinition =
  | BaseFieldDefinition<string>
  | BaseFieldDefinition<number>
  | BaseFieldDefinition<boolean>
  | BaseFieldDefinition<Date>
  | BaseFieldDefinition<string[]>;

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

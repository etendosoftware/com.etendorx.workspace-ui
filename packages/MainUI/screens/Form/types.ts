import { Section } from '@workspaceui/componentlibrary/components/FormView/types';
import { Field } from '@workspaceui/etendohookbinder/api/types';

export interface FieldInfo {
  fieldGroup$_identifier?: string;
}

export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'tabledir' | 'quantity' | 'list';

export interface BaseFieldDefinition<T> {
  value: T;
  type: FieldType;
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

export type FormData = Record<string, FieldDefinition | Section>;

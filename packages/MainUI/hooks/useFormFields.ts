import { useMemo } from 'react';
import { Field, FieldType, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useTranslation } from './useTranslation';
import { getFieldReference } from '@/utils/form';

export type FormFields = {
  statusBarFields: Record<string, Field>;
  formFields: Record<string, Field>;
  actionFields: Record<string, Field>;
  otherFields: Record<string, Field>;
};

export type FieldGroup = {
  id: string | null;
  identifier: string;
  sequenceNumber: number;
  fields: Record<string, Field>;
};

export type UseFormFields = {
  fields: FormFields;
  groups: [string, FieldGroup][];
};

export default function useFormFields(tab: Tab): UseFormFields {
  const { t } = useTranslation();

  const fields = useMemo<UseFormFields['fields']>(() => {
    const statusBarFields: Record<string, Field> = {};
    const formFields: Record<string, Field> = {};
    const actionFields: Record<string, Field> = {};
    const otherFields: Record<string, Field> = {};

    Object.entries(tab.fields).forEach(([, field]) => {
      const reference = getFieldReference(field.column.reference);
      // Keep this at first because a process field will have field.display == true
      if (field.process || field.column.process || reference === FieldType.BUTTON) {
        actionFields[field.hqlName] = field;
      } else if (field.shownInStatusBar) {
        statusBarFields[field.hqlName] = field;
      } else if (field.displayed) {
        formFields[field.hqlName] = field;
      } else {
        otherFields[field.hqlName] = field;
      }
    });

    return { statusBarFields, formFields, actionFields, otherFields };
  }, [tab.fields]);

  const groups = useMemo<UseFormFields['groups']>(() => {
    const result = {} as Record<
      string,
      { id: string | null; identifier: string; sequenceNumber: number; fields: Record<string, Field> }
    >;

    Object.entries(fields.formFields).forEach(([fieldName, field]) => {
      const [id = '', identifier = ''] = [field.fieldGroup, field.fieldGroup$_identifier];

      if (!result[id]) {
        result[id] = {
          id: id || null,
          identifier: identifier || t('forms.sections.main'),
          sequenceNumber: Number.MAX_SAFE_INTEGER,
          fields: {},
        };
      }

      result[id].fields[fieldName] = field;

      if (result[id].sequenceNumber > field.sequenceNumber) {
        result[id].sequenceNumber = field.sequenceNumber;
      }
    });

    return Object.entries(result).toSorted(([, a], [, b]) => {
      return a.sequenceNumber - b.sequenceNumber;
    });
  }, [fields.formFields, t]);

  return { fields, groups };
}

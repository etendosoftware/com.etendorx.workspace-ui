import { getFieldReference } from "@/utils";
import { type Field, FieldType, type Tab } from "@workspaceui/etendohookbinder/src/api/types";
import { useMemo } from "react";
import { useTranslation } from "./useTranslation";

export default function useFormFields(tab: Tab) {
  const { t } = useTranslation();

  const fields = useMemo(() => {
    const statusBarFields: Record<string, Field> = {};
    const formFields: Record<string, Field> = {};
    const actionFields: Record<string, Field> = {};
    const otherFields: Record<string, Field> = {};

    for (const [, field] of Object.entries(tab.fields)) {
      const reference = getFieldReference(field.column?.reference);
      // Keep this at first because a process field will have field.display == true
      if (field.processAction || field.processDefinition || reference === FieldType.BUTTON) {
        actionFields[field.hqlName] = field;
      } else if (field.shownInStatusBar) {
        statusBarFields[field.hqlName] = field;
      } else if (field.displayed) {
        formFields[field.hqlName] = field;
      } else {
        otherFields[field.hqlName] = field;
      }
    }

    return { statusBarFields, formFields, actionFields, otherFields };
  }, [tab.fields]);

  const fieldGroups = useMemo(() => {
    const groups = {} as Record<
      string,
      { id: string | null; identifier: string; sequenceNumber: number; fields: Record<string, Field> }
    >;

    for (const [fieldName, field] of Object.entries(fields.formFields)) {
      const [id = "", identifier = ""] = [field.fieldGroup, field.fieldGroup$_identifier];

      if (!groups[id]) {
        groups[id] = {
          id: id || null,
          identifier: identifier || t("forms.sections.main"),
          sequenceNumber: Number.MAX_SAFE_INTEGER,
          fields: {},
        };
      }

      groups[id].fields[fieldName] = field;

      if (groups[id].sequenceNumber > field.sequenceNumber) {
        groups[id].sequenceNumber = field.sequenceNumber;
      }
    }

    return groups;
  }, [fields.formFields, t]);

  const groups = useMemo(
    () =>
      Object.entries(fieldGroups).toSorted(([, a], [, b]) => {
        return a.sequenceNumber - b.sequenceNumber;
      }),
    [fieldGroups],
  );

  return { fields, groups };
}

// useFormFields.ts - Implementación corregida
import { getFieldReference } from "@/utils";
import {
  type Field,
  FieldType,
  type Tab,
  FormMode,
  type EntityValue,
} from "@workspaceui/etendohookbinder/src/api/types";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "./useTranslation";
import { logger } from "@/utils/logger";

const createAuditField = (fieldName: string, label: string, columnName: string, reference: string): Field =>
  ({
    id: `audit_${fieldName}`,
    name: label,
    hqlName: fieldName,
    displayed: true,
    displayLogicExpression: null,
    isReadOnly: true,
    isUpdatable: false,
    isMandatory: false,
    helpComment: `${label} information for audit purposes`,
    inputName: `inp${fieldName}`,
    isEditable: false,
    isFirstFocusedField: false,
    isParentRecordProperty: false,
    sequenceNumber: 9999,
    shownInStatusBar: false,
    fieldGroup: "audit",
    fieldGroup$_identifier: "Audit",
    displayField: "_identifier",
    column: {
      id: `audit_col_${fieldName}`,
      name: columnName,
      reference,
      dBColumnName: columnName,
    },
    displayFieldOnly: false,
    displayOnSameLine: false,
    displayedLength: reference === "16" ? 20 : 32,
    gridPosition: null,
    ignoreInWad: false,
    processAction: null,
    processDefinition: null,
    readOnly: true,
    startinoddcolumn: false,
    startnewline: false,
    showInGridView: false,
  }) as unknown as Field;

interface UseFormFieldsReturn {
  fields: {
    statusBarFields: Record<string, Field>;
    formFields: Record<string, Field>;
    actionFields: Record<string, Field>;
    otherFields: Record<string, Field>;
  };
  groups: Array<
    [
      string,
      {
        id: string | null;
        identifier: string;
        sequenceNumber: number;
        fields: Record<string, Field>;
      },
    ]
  >;
}

export default function useFormFields(
  tab: Tab,
  mode: FormMode = FormMode.EDIT,
  hasAuditData = false,
  availableFormData: { [x: string]: EntityValue } = {}
): UseFormFieldsReturn {
  const { t } = useTranslation();
  const formContext = useFormContext();

  const autoDetectAuditData = useMemo(() => {
    if (mode === FormMode.NEW) {
      return false;
    }

    const formValues = formContext?.watch?.() || availableFormData || {};

    const hasAuditInForm = !!(
      formValues?.creationDate ||
      formValues?.createdBy$_identifier ||
      formValues?.updated ||
      formValues?.updatedBy$_identifier
    );

    const hasAuditInTab = !!(
      tab.fields.creationDate ||
      tab.fields.createdBy$_identifier ||
      tab.fields.updated ||
      tab.fields.updatedBy$_identifier
    );

    const result = hasAuditInForm || hasAuditInTab || hasAuditData;
    return result;
  }, [mode, formContext, hasAuditData, tab.fields, availableFormData]);

  const createAuditFields = useMemo(() => {
    return () => {
      const auditFields: Record<string, Field> = {};

      const formValues = formContext?.watch?.() || availableFormData || {};

      if (tab.fields.creationDate || formValues.creationDate) {
        auditFields.creationDate = createAuditField("creationDate", t("audit.createdDate"), "creationDate", "16");
      }
      if (tab.fields.createdBy || formValues.createdBy || formValues.createdBy$_identifier) {
        auditFields.createdBy = createAuditField("createdBy$_identifier", t("audit.createdBy"), "createdBy", "19");
      }
      if (tab.fields.updated || formValues.updated) {
        auditFields.updated = createAuditField("updated", t("audit.updated"), "updated", "16");
      }
      if (tab.fields.updatedBy || formValues.updatedBy || formValues.updatedBy$_identifier) {
        auditFields.updatedBy = createAuditField("updatedBy$_identifier", t("audit.updatedBy"), "updatedBy", "18");
      }

      return auditFields;
    };
  }, [tab.fields, formContext, t, availableFormData]);

  const fields = useMemo(() => {
    const statusBarFields: Record<string, Field> = {};
    const formFields: Record<string, Field> = {};
    const actionFields: Record<string, Field> = {};
    const otherFields: Record<string, Field> = {};

    for (const [, field] of Object.entries(tab.fields)) {
      const reference = getFieldReference(field.column?.reference);
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

    if (autoDetectAuditData) {
      const auditFields = createAuditFields();
      Object.assign(formFields, auditFields);
    }

    return { statusBarFields, formFields, actionFields, otherFields };
  }, [autoDetectAuditData, tab.fields, createAuditFields]);

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

    if (groups.audit) {
      groups.audit.sequenceNumber = 9999;
      groups.audit.identifier = t("forms.sections.audit");
    } 
    return groups;
  }, [fields.formFields, t]);

  const groups = useMemo(() => {
    const sortedGroups = Object.entries(fieldGroups).toSorted(([, a], [, b]) => {
      return a.sequenceNumber - b.sequenceNumber;
    });

    return sortedGroups;
  }, [fieldGroups]);

  return { fields, groups };
}

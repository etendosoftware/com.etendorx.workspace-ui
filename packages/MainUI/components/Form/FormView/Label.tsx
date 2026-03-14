/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { memo, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { isEntityReference } from "@workspaceui/api-client/src/utils/metadata";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { getFieldReference } from "@/utils";
import BaseLabel from "@/components/Label";
import { useRedirect } from "@/hooks/navigation/useRedirect";
import { CUSTOM_SELECTORS_IDENTIFIERS } from "@/utils/form/constants";
import { useTabContext } from "@/contexts/tab";

function LabelCmp({ field }: { field: Field }) {
  const { watch } = useFormContext();
  const { tab } = useTabContext();
  const value = watch(field.hqlName);
  const isReference = useMemo(() => isEntityReference(getFieldReference(field.column?.reference)), [field]);
  const isAccessible = field.isReferencedWindowAccessible ?? false;
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();

  if (
    field.fieldGroup !== "audit" &&
    value &&
    isReference &&
    isAccessible &&
    field.column.referenceSearchKey$_identifier !== CUSTOM_SELECTORS_IDENTIFIERS.LOCATION
  ) {
    const windowId = field.referencedWindowId || "";
    const windowTitle = field.name;
    const referencedTabId = field.referencedTabId || "";
    const selectedRecordId = String(value);

    // Build context for ReferencedLink resolution (same as Etendo Classic)
    const referencedLinkContext =
      field.id && field.referencedEntity
        ? {
            entityName: field.referencedEntity,
            fieldId: field.id,
            currentWindowId: tab.window,
            // field.column contains the full ADColumn JSON — dBColumnName is the DB column name
            // (e.g. "C_Orderline_ID"), which is what inpKeyReferenceColumnName expects
            columnName: (field.column as Record<string, unknown>)?.dBColumnName as string,
          }
        : undefined;

    return (
      <BaseLabel
        name={`${field.name}`}
        htmlFor={field.hqlName}
        onClick={(e) => {
          console.debug("[Label] Reference clicked - field properties:", {
            "field.id": field.id,
            "field.referencedEntity": field.referencedEntity,
            "field.refColumnName": field.refColumnName,
            "field.column": field.column,
            "field.referencedWindowId": field.referencedWindowId,
            "field.referencedTabId": field.referencedTabId,
            "tab.window": tab.window,
            "referencedLinkContext": referencedLinkContext,
            selectedRecordId,
          });
          handleClickRedirect({ e, windowId, windowTitle, referencedTabId, selectedRecordId, referencedLinkContext });
        }}
        onKeyDown={(e) =>
          handleKeyDownRedirect({ e, windowId, windowTitle, referencedTabId, selectedRecordId, referencedLinkContext })
        }
        link
        data-testid="BaseLabel__40c6fe"
      />
    );
  }

  return <BaseLabel name={field.name} htmlFor={field.hqlName} data-testid="BaseLabel__40c6fe" />;
}

const Label = memo(LabelCmp, () => true);
export { Label };
export default Label;

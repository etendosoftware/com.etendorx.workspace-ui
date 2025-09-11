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

function LabelCmp({ field }: { field: Field }) {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);
  const isReference = useMemo(() => isEntityReference(getFieldReference(field.column?.reference)), [field]);
  const { handleClickRedirect, handleKeyDownRedirect } = useRedirect();

  if (
    field.fieldGroup !== "audit" &&
    value &&
    isReference &&
    field.column.referenceSearchKey$_identifier !== CUSTOM_SELECTORS_IDENTIFIERS.LOCATION
  ) {
    return (
      <BaseLabel
        name={`${field.name}`}
        htmlFor={field.hqlName}
        onClick={(e) => handleClickRedirect(e, field.referencedWindowId, field.name, String(value))}
        onKeyDown={(e) => handleKeyDownRedirect(e, field.referencedWindowId, field.name, String(value))}
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

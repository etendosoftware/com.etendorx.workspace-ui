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

import type { Field } from "@workspaceui/api-client/src/api/types";
import { useFormContext } from "react-hook-form";
import { useFieldValue } from "@/hooks/useFieldValue";

export default function StatusBarField({ field }: { field: Field }) {
  const { register } = useFormContext();
  const { displayValue } = useFieldValue(field);

  return (
    <div className="inline-flex gap-1">
      <label htmlFor={field.hqlName} className="font-semibold">
        {field.name}:
      </label>
      <span className="" {...register(field.hqlName)}>
        {displayValue}
      </span>
    </div>
  );
}

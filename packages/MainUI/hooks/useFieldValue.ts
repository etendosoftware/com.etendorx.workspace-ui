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

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { type Field, FieldType } from "@workspaceui/api-client/src/api/types";
import { formatNumber, getFieldReference } from "@/utils";

/**
 * Hook to safely get field value with proper identifier/value synchronization
 */
export const useFieldValue = (field: Field) => {
  const { watch } = useFormContext();
  const [value, identifier] = watch([field.hqlName, `${field.hqlName}$_identifier`]);

  const displayValue = useMemo(() => {
    if (identifier !== null && identifier !== undefined && identifier !== "") {
      return identifier;
    }

    if (value === null || value === undefined || value === "") {
      return "";
    }

    const reference = getFieldReference(field.column?.reference);

    switch (reference) {
      case FieldType.DATE:
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      case FieldType.BOOLEAN:
        return value ? "Y" : "N";
      case FieldType.NUMBER:
      case FieldType.QUANTITY:
        return formatNumber(value);
      default:
        return String(value);
    }
  }, [field, identifier, value]);

  return {
    value,
    identifier,
    displayValue,
    hasIdentifier: identifier !== null && identifier !== undefined && identifier !== "",
    isEmpty:
      (value === null || value === undefined || value === "") &&
      (identifier === null || identifier === undefined || identifier === ""),
  };
};

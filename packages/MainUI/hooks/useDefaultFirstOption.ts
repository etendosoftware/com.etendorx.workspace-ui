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
import type { SelectOption } from "@/components/Form/FormView/selectors/components/types";
import { updateSelectorValue } from "@/utils/form/selectors/utils";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

interface UseDefaultFirstOptionParams {
  field: Field;
  options: SelectOption[];
  loading: boolean;
  /** Restricts the behavior to process modals; standard windows keep their own defaults. */
  enabled: boolean;
}

/** A combo value is "present" only when it is a non-empty string matching a loaded option. */
const isValueInOptions = (value: unknown, options: SelectOption[]): boolean => {
  if (typeof value !== "string" || value === "") {
    return false;
  }
  return options.some((option) => option.id === value);
};

/**
 * Mirrors Classic's mandatory `<select>` behavior: a required combo never stays on
 * a value that is not among its options. When the resolved value is empty or not in
 * the loaded options, the first option is auto-selected (e.g. an `AD_Org_ID`
 * parameter seeded with the non-selectable `*` org falls back to the first valid org).
 *
 * Runs once per field instance (guarded by a ref) so it never fights user edits or
 * loops. It is a no-op for optional fields, while loading, when there are no options,
 * or outside process modals.
 */
export const useDefaultFirstOption = ({ field, options, loading, enabled }: UseDefaultFirstOptionParams): void => {
  const { getValues, setValue } = useFormContext();
  const appliedRef = useRef(false);
  const fieldName = field.hqlName || field.columnName || field.name;

  useEffect(() => {
    if (!enabled || !field.isMandatory || appliedRef.current) {
      return;
    }
    if (loading || options.length === 0) {
      return;
    }

    const currentValue = getValues(fieldName);
    if (isValueInOptions(currentValue, options)) {
      // A valid value is already selected: lock so a later edit is never overridden.
      appliedRef.current = true;
      return;
    }

    const [firstOption] = options;
    updateSelectorValue(setValue, fieldName, firstOption.id, { _identifier: firstOption.label });
    appliedRef.current = true;
  }, [enabled, field.isMandatory, fieldName, options, loading, getValues, setValue]);
};

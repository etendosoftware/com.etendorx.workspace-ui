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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { collectExpressionDependencies } from "@/utils/expressions/dependencies";

const NO_EXTRA_NAMES: readonly string[] = [];

/**
 * The form values to evaluate the display logic of `fields` with. The caller re-renders only when a field
 * that logic reads (or one of `extraNames`) changes, or the form is reset, instead of on every keystroke
 * as with `watch()`. The values returned are the whole form, so the evaluation context is the same as
 * with `watch()` for every expression whose dependencies the extractor finds.
 */
export function useDisplayLogicFormValues(
  fields?: Record<string, Field>,
  extraNames: readonly string[] = NO_EXTRA_NAMES
): Record<string, unknown> {
  const { getValues } = useFormContext();
  const names = useMemo(
    () => [
      ...collectExpressionDependencies(
        Object.values(fields ?? {}).map((field) => field.displayLogicExpression),
        fields
      ),
      ...extraNames,
    ],
    [fields, extraNames]
  );
  // When `names` changes (new tab metadata), useWatch keeps its previous result until the next form event;
  // metadata changes come with a reset, which is such an event.
  const watched = useWatch({ name: names });
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new snapshot each time a watched value changes
  return useMemo(() => getValues(), [watched, getValues]);
}

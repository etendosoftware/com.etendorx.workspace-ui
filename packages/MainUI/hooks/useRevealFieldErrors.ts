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

import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { SECTION_TRANSITION_MS, addSectionsToExpand, resolveFieldSectionId } from "@/utils/form/expandedSections";
import { findFirstFieldFocusTarget } from "@/utils/form/focus";

interface UseRevealFieldErrorsParams {
  /** Container holding the form sections — where the fields are looked up. */
  fieldsRootRef: RefObject<HTMLElement | null>;
  /** Field metadata of the tab, used to resolve the section of every field. */
  fields: Record<string, Field> | undefined;
  /** Setter of the expanded sections of the form. */
  setExpandedSections: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * Brings the focus to the first of the given fields in form order and scrolls it
 * into view. Fields that are not rendered (or not focusable) are ignored.
 */
const focusFirstField = (root: HTMLElement | null, fieldNames: readonly string[]): void => {
  const target = findFirstFieldFocusTarget(root, fieldNames);
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "center", behavior: "smooth" });
};

/**
 * Reveals the fields that failed validation, the way Classic's
 * `OBViewForm.handleFieldErrors` does: every collapsed section holding one of them
 * is expanded and the focus lands on the first one in form order.
 *
 * Sections that are already expanded are left untouched. The expansion goes through
 * the same setter as a manual toggle, so it is kept as the tab's preference.
 *
 * @returns Callback receiving the `hqlName` of the fields in error
 */
export function useRevealFieldErrors({
  fieldsRootRef,
  fields,
  setExpandedSections,
}: UseRevealFieldErrorsParams): (fieldNames: readonly string[]) => void {
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fieldsByName = useMemo(
    () => new Map(Object.values(fields ?? {}).map((field) => [field.hqlName, field])),
    [fields]
  );

  const clearPendingFocus = useCallback(() => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearPendingFocus, [clearPendingFocus]);

  /**
   * Expands the sections holding the given fields.
   *
   * @returns Whether at least one section had to be expanded
   */
  const expandSectionsOf = useCallback(
    (fieldNames: readonly string[]): boolean => {
      const sectionIds = fieldNames
        .map((name) => fieldsByName.get(name))
        .filter((field): field is Field => Boolean(field))
        .map(resolveFieldSectionId);

      // The persisted setter (useFormSectionsPersistenceTab) runs the updater
      // synchronously, so the flag is settled once the call returns.
      let hasExpanded = false;
      setExpandedSections((prev) => {
        const next = addSectionsToExpand(prev, sectionIds);
        hasExpanded = next !== prev;
        return next;
      });
      return hasExpanded;
    },
    [fieldsByName, setExpandedSections]
  );

  return useCallback(
    (fieldNames: readonly string[]) => {
      if (fieldNames.length === 0) return;
      clearPendingFocus();

      // A section that has just been expanded only exposes its fields once its
      // animation ends, so the focus waits for it.
      const delay = expandSectionsOf(fieldNames) ? SECTION_TRANSITION_MS : 0;
      focusTimeoutRef.current = setTimeout(() => {
        focusTimeoutRef.current = null;
        focusFirstField(fieldsRootRef.current, fieldNames);
      }, delay);
    },
    [clearPendingFocus, expandSectionsOf, fieldsRootRef]
  );
}

export default useRevealFieldErrors;

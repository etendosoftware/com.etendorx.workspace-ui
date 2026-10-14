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

import { type RefObject, useEffect, useRef } from "react";
import { resolveInitialFocusTarget } from "@/utils/form/focus";
import { isDebugFormFocus } from "@/utils/debug";

/**
 * Traces the decision points of the initial focus, off unless explicitly enabled
 * with `localStorage.DEBUG_FORM_FOCUS` / `NEXT_PUBLIC_DEBUG_FORM_FOCUS`.
 *
 * Writes to the console directly: `logger.debug` is a no-op regardless of any
 * flag (`Logger.enableDebugLogs` is hardcoded to false), so it would never print.
 */
const logFormFocus = (outcome: string, details: Record<string, unknown>): void => {
  if (!isDebugFormFocus()) return;
  console.debug(`[FormFocus] ${outcome}`, details);
};

interface UseFormInitialFocusParams {
  /** Container holding the form sections — the root of the tab sequence. */
  fieldsRootRef: RefObject<HTMLElement | null>;
  /**
   * The form owns the keyboard right now. In split view this is false while the
   * grid pane holds the focus, so loading a record from a row click never pulls
   * the caret out of the grid.
   */
  enabled: boolean;
  /** Field metadata and values are loaded, so the fields are rendered. */
  isReady: boolean;
  /**
   * Changes exactly once per situation that deserves a fresh focus: opening the
   * form, creating a record, navigating to another one. Data refreshes (such as
   * a post-save refetch) keep the same key and leave the focus alone.
   */
  focusKey: string;
  /**
   * Changes whenever the rendered field layout does. The sections of a form start
   * collapsed — the expansion preference is only seeded once the metadata has
   * arrived — and a collapsed section holds no focusable field, so a first
   * attempt can legitimately find nothing. This token retries it.
   */
  layoutToken: string;
  /** `hqlName` of the field flagged as `isFirstFocusedField` in the dictionary. */
  firstFocusedFieldName?: string;
}

/**
 * Puts the keyboard focus on the first editable field when the form opens,
 * mirroring `OBViewForm.setFocusInForm` of Etendo Classic.
 *
 * The focus is applied asynchronously so it runs after `Collapsible` has
 * neutralised the fields of collapsed sections; otherwise a collapsed first
 * section could win the focus.
 */
export function useFormInitialFocus({
  fieldsRootRef,
  enabled,
  isReady,
  focusKey,
  layoutToken,
  firstFocusedFieldName,
}: UseFormInitialFocusParams): void {
  const focusedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isReady) {
      logFormFocus("skipped", { focusKey, enabled, isReady });
      return;
    }
    if (focusedKeyRef.current === focusKey) return;

    const timeoutId = setTimeout(() => {
      const root = fieldsRootRef.current;
      if (!root) {
        logFormFocus("no fields root yet", { focusKey });
        return;
      }
      // Never steal the caret from a field the user is already typing in: blurring
      // it would fire its callout.
      if (root.contains(document.activeElement)) {
        logFormFocus("focus already inside the form", { focusKey });
        return;
      }

      const target = resolveInitialFocusTarget(root, firstFocusedFieldName);
      if (!target) {
        // Every section may still be collapsed; the layoutToken retries later.
        logFormFocus("no focusable field", { focusKey, layoutToken });
        return;
      }

      focusedKeyRef.current = focusKey;
      target.focus({ preventScroll: true });
      logFormFocus("focused", { focusKey, firstFocusedFieldName, target });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fieldsRootRef, enabled, isReady, focusKey, layoutToken, firstFocusedFieldName]);
}

export default useFormInitialFocus;

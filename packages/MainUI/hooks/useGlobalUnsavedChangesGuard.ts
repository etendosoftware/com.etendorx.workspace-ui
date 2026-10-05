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

import { useCallback } from "react";
import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { hasAnyDirty } from "@/utils/window/dirtyState";

/**
 * Guards an app-level exit (logout, role change, language change) behind the
 * unsaved-changes modal.
 *
 * Only manual, user-triggered exits go through this. The automatic logout paths
 * (401 interceptor, session keep-alive, expired password) call `logout()` directly
 * and must stay instant and uncancellable.
 */
export function useGlobalUnsavedChangesGuard() {
  const dirtyWindows = useWindowStore((s) => s.dirtyWindows);
  const openRequest = useUnsavedChangesStore((s) => s.openRequest);

  /** Runs `action` right away when nothing is dirty; otherwise defers it behind the modal. */
  const guard = useCallback(
    (action: () => void) => {
      if (!hasAnyDirty(dirtyWindows)) {
        action();
        return;
      }
      openRequest({ onProceed: action });
    },
    [dirtyWindows, openRequest]
  );

  return { guard };
}

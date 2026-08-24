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

import { useEffect, useMemo } from "react";
import { useWindowStore } from "@/stores/windowStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { hasAnyDirty } from "@/utils/window/dirtyState";

/**
 * Shows the browser's native warning when the page is closed or reloaded while
 * some window still holds unsaved changes.
 *
 * Browsers only allow the generic native dialog here — a custom modal listing the
 * dirty windows is not possible on unload — so this is deliberately the one exit
 * point that does not use the app's own modal.
 *
 * The listener exists only while something is dirty, so it disappears on its own
 * once everything is saved or discarded. It never fires on programmatic navigation,
 * which is what keeps the automatic session-expiry logout unaffected.
 */
export function useUnsavedChangesBeforeUnload() {
  const dirtyWindows = useWindowStore((s) => s.dirtyWindows);
  const bypassUnloadWarning = useUnsavedChangesStore((s) => s.bypassUnloadWarning);

  const shouldWarn = useMemo(
    () => hasAnyDirty(dirtyWindows) && !bypassUnloadWarning,
    [dirtyWindows, bypassUnloadWarning]
  );

  useEffect(() => {
    if (!shouldWarn) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers need a non-empty returnValue to raise the dialog. The string
      // itself is never displayed — every modern browser shows its own wording.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldWarn]);
}

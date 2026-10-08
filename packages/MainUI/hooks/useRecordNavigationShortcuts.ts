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
import { useShortcutBindings } from "@/hooks/useShortcutBindings";
import { SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";

interface UseRecordNavigationShortcutsParams {
  onPrevious: () => void;
  onNext: () => void;
  enabled: boolean;
}

/**
 * Classic status bar `StatusBar_Previous` / `StatusBar_Next` (Alt+Shift+PageUp / PageDown). They
 * run the same handlers as the status bar arrows, so the unsaved-changes guard and the limits of
 * the record list apply exactly as on a click.
 */
export function useRecordNavigationShortcuts({ onPrevious, onNext, enabled }: UseRecordNavigationShortcutsParams) {
  const bindings = useMemo(
    () => ({
      [SHORTCUT_IDS.STATUS_BAR_PREVIOUS]: { handler: onPrevious },
      [SHORTCUT_IDS.STATUS_BAR_NEXT]: { handler: onNext },
    }),
    [onPrevious, onNext]
  );
  useShortcutBindings(bindings, enabled);
}

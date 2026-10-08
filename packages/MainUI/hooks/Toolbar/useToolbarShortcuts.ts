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
import type { TopToolbarProps } from "@/components/Toolbar/types";
import { useShortcutBindings } from "@/hooks/useShortcutBindings";
import { buildToolbarShortcutBindings } from "@/utils/toolbar/shortcuts";

/**
 * Binds the classic toolbar shortcuts (new, undo, delete, refresh, export, attachments, clone,
 * print, email, audit trail and link) to the buttons of this toolbar while its tab is focused.
 * Each shortcut presses its button, so disabled buttons do nothing and confirmations still show.
 */
export function useToolbarShortcuts(
  sections: Pick<TopToolbarProps, "leftSection" | "centerSection" | "rightSection">,
  isFocused: boolean
): void {
  const bindings = useMemo(() => buildToolbarShortcutBindings(sections), [sections]);
  useShortcutBindings(bindings, isFocused);
}

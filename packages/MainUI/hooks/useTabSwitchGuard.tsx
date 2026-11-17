/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useCallback, useRef, useState } from "react";
import SaveDiscardCancelModal from "@/components/UnsavedChanges/SaveDiscardCancelModal";
import { useSaveDirtyWindow } from "@/hooks/useSaveDirtyWindow";
import { useTranslation } from "@/hooks/useTranslation";
import { useToolbarStore } from "@/stores/toolbarStore";
import { useWindowStore } from "@/stores/windowStore";
import { getAutosavePolicy } from "@/utils/autosave";
import { createEmptyActionsByOwner, resolveToolbarActions } from "@/utils/toolbar/actionOwnership";
import { DIRTY_SOURCE_KINDS, getDirtySources } from "@/utils/window/dirtyState";

interface PendingSwitch {
  tabIds: string[];
  run: () => void;
  confirmOnly: boolean;
}

/**
 * Applies the Autosave and Show Confirmation Default preferences when the user moves to another
 * tab of the window, like Classic: with Autosave on the tab being left is saved, then the move
 * happens (a failed save keeps the user where they are); with Show Confirmation Default on it asks
 * first; with Autosave off the user chooses between saving, discarding and staying.
 *
 * The tab strip sits above the tabs, so it cannot reach their own guard. It reads the window store
 * and saves through the toolbar store instead, the way the unsaved-windows prompt does.
 *
 * @param windowIdentifier - Identifier of the window the tabs belong to.
 * @param windowId - AD window id, to resolve the preferences for that window.
 * @returns `guardTabSwitch(targetTabId, move)`, and the `prompt` element to render once.
 */
export function useTabSwitchGuard(windowIdentifier: string | undefined, windowId: string | undefined) {
  const { t } = useTranslation();
  const { saveWindow } = useSaveDirtyWindow();
  const [pending, setPending] = useState<PendingSwitch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inFlightRef = useRef(false);

  /** Tabs with unsaved form changes that the move leaves behind: every dirty tab but the destination. */
  const getLeftTabIds = useCallback(
    (targetTabId: string): string[] => {
      if (!windowIdentifier) {
        return [];
      }
      const { dirtyWindows } = useWindowStore.getState();
      return getDirtySources(dirtyWindows, windowIdentifier)
        .filter((source) => source.kind === DIRTY_SOURCE_KINDS.FORM && source.tabId !== targetTabId)
        .map((source) => source.tabId);
    },
    [windowIdentifier]
  );

  const saveThenRun = useCallback(
    async (run: () => void): Promise<boolean> => {
      if (!windowIdentifier || inFlightRef.current) {
        return false;
      }
      inFlightRef.current = true;
      try {
        // A failed save leaves the user on the tab: its own error message is already on screen.
        if (!(await saveWindow(windowIdentifier))) {
          return false;
        }
      } finally {
        inFlightRef.current = false;
      }
      run();
      return true;
    },
    [saveWindow, windowIdentifier]
  );

  const guardTabSwitch = useCallback(
    (targetTabId: string, move: () => void) => {
      const tabIds = getLeftTabIds(targetTabId);
      if (tabIds.length === 0) {
        move();
        return;
      }
      const policy = getAutosavePolicy(windowId);
      if (policy.autosave && !policy.confirm) {
        void saveThenRun(move);
        return;
      }
      setPending({ tabIds, run: move, confirmOnly: policy.autosave });
    },
    [getLeftTabIds, windowId, saveThenRun]
  );

  const handleSave = useCallback(async () => {
    if (!pending) {
      return;
    }
    setIsSaving(true);
    try {
      if (await saveThenRun(pending.run)) {
        setPending(null);
      }
    } finally {
      setIsSaving(false);
    }
  }, [pending, saveThenRun]);

  const handleDiscard = useCallback(() => {
    if (!pending) {
      return;
    }
    for (const tabId of pending.tabIds) {
      const byOwner = useToolbarStore.getState().byTabId[tabId]?.actionsByOwner ?? createEmptyActionsByOwner();
      resolveToolbarActions(byOwner).discard();
    }
    const { run } = pending;
    setPending(null);
    run();
  }, [pending]);

  const prompt = (
    <SaveDiscardCancelModal
      open={pending !== null}
      message={t(pending?.confirmOnly ? "unsavedChanges.autosaveMessage" : "unsavedChanges.transitionMessage")}
      hideDiscard={pending?.confirmOnly}
      isSaving={isSaving}
      onSave={handleSave}
      onDiscard={handleDiscard}
      onCancel={() => setPending(null)}
    />
  );

  return { guardTabSwitch, prompt };
}

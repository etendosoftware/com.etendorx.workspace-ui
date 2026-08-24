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

"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useTabContext } from "@/contexts/tab";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useCurrentWindowIdentifier } from "@/contexts/CurrentWindowContext";
import { useWindowStore } from "@/stores/windowStore";
import { isTabDirty } from "@/utils/window/dirtyState";
import { useTranslation } from "@/hooks/useTranslation";
import SaveDiscardCancelModal from "@/components/UnsavedChanges/SaveDiscardCancelModal";

/** Something the user asked for that would replace what the form currently holds. */
export type GuardedTransition = () => void | Promise<void>;

interface PendingTransition {
  run: GuardedTransition;
  onCancel?: () => void;
}

interface UnsavedChangesTabGuardI {
  /**
   * Runs `transition` straight away when the tab has nothing unsaved; otherwise asks the
   * user to save, discard or cancel first.
   *
   * @param onCancel - Optional cleanup for the caller when the user backs out, e.g. putting
   *                   a grid selection back where it was.
   */
  guardTransition: (transition: GuardedTransition, onCancel?: () => void) => void;
}

const UnsavedChangesTabGuardContext = createContext<UnsavedChangesTabGuardI>({
  guardTransition: (transition) => {
    void transition();
  },
});

/**
 * Per-tab guard for in-window transitions that would drop unsaved changes
 * (Escape, record navigation arrows, split-view record switch).
 *
 * Mounted inside ToolbarProvider because it needs the tab's registered `save` and
 * `discard`, and above the tab content so the form, the grid and the tab shell can all
 * reach the same single prompt.
 */
export default function UnsavedChangesTabGuardProvider({ children }: React.PropsWithChildren) {
  const { t } = useTranslation();
  const { tab } = useTabContext();
  const { onSave, onDiscard } = useToolbarContext();
  const windowIdentifier = useCurrentWindowIdentifier();
  const dirtyWindows = useWindowStore((s) => s.dirtyWindows);

  const [pending, setPending] = useState<PendingTransition | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // The dirty registry is the source of truth, not TabContext's `hasFormChanges`: that
  // flag is also raised for a pristine NEW record to enable the Save button.
  const isDirty = isTabDirty(dirtyWindows, windowIdentifier, tab?.id ?? "");

  const guardTransition = useCallback(
    (transition: GuardedTransition, onCancel?: () => void) => {
      if (!isDirty) {
        void transition();
        return;
      }
      setPending({ run: transition, onCancel });
    },
    [isDirty]
  );

  const runPending = useCallback(() => {
    const transition = pending?.run;
    setPending(null);
    void transition?.();
  }, [pending]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const succeeded = await onSave({ showModal: false });
      // A failed save leaves the prompt open: its own error message is already on screen.
      if (!succeeded) {
        return;
      }
      runPending();
    } finally {
      setIsSaving(false);
    }
  }, [onSave, runPending]);

  const handleDiscard = useCallback(() => {
    onDiscard();
    runPending();
  }, [onDiscard, runPending]);

  const handleCancel = useCallback(() => {
    const onCancel = pending?.onCancel;
    setPending(null);
    onCancel?.();
  }, [pending]);

  const value = useMemo(() => ({ guardTransition }), [guardTransition]);

  return (
    <UnsavedChangesTabGuardContext.Provider value={value}>
      {children}
      <SaveDiscardCancelModal
        open={pending !== null}
        message={t("unsavedChanges.transitionMessage")}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onCancel={handleCancel}
        data-testid="SaveDiscardCancelModal__tabGuard"
      />
    </UnsavedChangesTabGuardContext.Provider>
  );
}

export const useUnsavedChangesTabGuard = () => useContext(UnsavedChangesTabGuardContext);

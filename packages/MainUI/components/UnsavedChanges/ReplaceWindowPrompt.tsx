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

import { useCallback, useState } from "react";
import { toast } from "sonner";
import SaveDiscardCancelModal from "@/components/UnsavedChanges/SaveDiscardCancelModal";
import { useTranslation } from "@/hooks/useTranslation";
import { useSaveDirtyWindow } from "@/hooks/useSaveDirtyWindow";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { useWindowStore } from "@/stores/windowStore";
import { getTitleForWindow } from "@/utils/window/windowTitle";

export interface ReplaceWindowPromptProps {
  /** The window that the pending action replaces. */
  windowIdentifier: string;
}

/**
 * Asks about the unsaved changes of the one window an action is about to replace (a window opened again
 * while `AllowMultiTab` is not Y). Unlike the exit menu, discarding does not close the window: the action
 * replaces it and its changes go with it, so the window keeps its place.
 */
export default function ReplaceWindowPrompt({ windowIdentifier }: ReplaceWindowPromptProps) {
  const { t } = useTranslation();
  const { saveWindow } = useSaveDirtyWindow();
  const windowsData = useMetadataZustandStore((s) => s.windowsData);
  const [isSaving, setIsSaving] = useState(false);

  const takeRequest = useCallback(() => {
    const { request, closeRequest } = useUnsavedChangesStore.getState();
    closeRequest();
    return request;
  }, []);

  const handleProceed = useCallback(() => takeRequest()?.onProceed(), [takeRequest]);
  const handleCancel = useCallback(() => takeRequest()?.onCancel?.(), [takeRequest]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (await saveWindow(windowIdentifier)) {
        handleProceed();
        return;
      }
      const window = useWindowStore.getState().windows[windowIdentifier];
      const title = window ? getTitleForWindow(window, windowsData) : "";
      toast.error(`${t("unsavedChanges.saveFailed")} ${title}`.trim());
    } finally {
      setIsSaving(false);
    }
  }, [saveWindow, windowIdentifier, handleProceed, windowsData, t]);

  return (
    <SaveDiscardCancelModal
      open
      message={t("unsavedChanges.transitionMessage")}
      isSaving={isSaving}
      onSave={handleSave}
      onDiscard={handleProceed}
      onCancel={handleCancel}
      data-testid="SaveDiscardCancelModal__replaceWindow"
    />
  );
}

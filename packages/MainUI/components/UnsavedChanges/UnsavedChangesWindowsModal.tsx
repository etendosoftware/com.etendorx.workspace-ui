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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { toast } from "sonner";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import { useStyles } from "@workspaceui/componentlibrary/src/components/BasicModal/styles";
import { useTranslation } from "@/hooks/useTranslation";
import { useWindowStore } from "@/stores/windowStore";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { useSaveDirtyWindow } from "@/hooks/useSaveDirtyWindow";
import { DIRTY_SOURCE_KINDS, getDirtySources, getDirtyWindowIdentifiers } from "@/utils/window/dirtyState";
import { getTitleForWindow } from "@/utils/window/windowTitle";

interface DirtyWindowRow {
  windowIdentifier: string;
  title: string;
  /** The window has a form whose save can be triggered from here. */
  hasSavableForm: boolean;
  /** The window has inline-edited grid rows, which can only be discarded from here. */
  hasGridEditing: boolean;
}

/**
 * One row per dirty window so a user in a hurry can save what matters, discard the rest,
 * or skip the whole thing with a single "discard all".
 *
 * Inline grid rows only offer Discard: their save lives inside the Table component and is
 * not reachable through the per-tab action bus.
 *
 * Split from the exported component so the MUI theme hooks only run while the menu is on
 * screen: the wrapper is mounted for the whole session but the menu is rarely open.
 */
function OpenUnsavedChangesWindowsModal() {
  const { t } = useTranslation();
  const { sx } = useStyles();

  const request = useUnsavedChangesStore((s) => s.request);
  const closeRequest = useUnsavedChangesStore((s) => s.closeRequest);
  const dirtyWindows = useWindowStore((s) => s.dirtyWindows);
  const windows = useWindowStore((s) => s.windows);
  const cleanupWindow = useWindowStore((s) => s.cleanupWindow);
  const windowsData = useMetadataZustandStore((s) => s.windowsData);
  const { saveWindow } = useSaveDirtyWindow();

  const [savingWindowIdentifier, setSavingWindowIdentifier] = useState<string | null>(null);

  const rows = useMemo<DirtyWindowRow[]>(() => {
    const dirtyRows: DirtyWindowRow[] = [];
    for (const windowIdentifier of getDirtyWindowIdentifiers(dirtyWindows)) {
      const window = windows[windowIdentifier];
      if (!window) {
        continue;
      }
      const sources = getDirtySources(dirtyWindows, windowIdentifier);
      dirtyRows.push({
        windowIdentifier,
        title: getTitleForWindow(window, windowsData),
        hasSavableForm: sources.some((source) => source.kind === DIRTY_SOURCE_KINDS.FORM),
        hasGridEditing: sources.some((source) => source.kind === DIRTY_SOURCE_KINDS.TABLE),
      });
    }
    return dirtyRows;
  }, [dirtyWindows, windows, windowsData]);

  /** Closes the modal and runs the held-back action. */
  const proceed = useCallback(() => {
    const pending = useUnsavedChangesStore.getState().request;
    closeRequest();
    pending?.onProceed();
  }, [closeRequest]);

  // Every window resolved (saved or discarded) — let the original action through.
  useEffect(() => {
    if (!request) {
      return;
    }
    if (rows.length > 0) {
      return;
    }
    proceed();
  }, [request, rows.length, proceed]);

  const handleSaveWindow = useCallback(
    async (row: DirtyWindowRow) => {
      setSavingWindowIdentifier(row.windowIdentifier);
      try {
        const succeeded = await saveWindow(row.windowIdentifier);
        if (!succeeded) {
          toast.error(`${t("unsavedChanges.saveFailed")} ${row.title}`);
        }
      } finally {
        setSavingWindowIdentifier(null);
      }
    },
    [saveWindow, t]
  );

  const handleDiscardWindow = useCallback(
    (row: DirtyWindowRow) => {
      cleanupWindow(row.windowIdentifier);
    },
    [cleanupWindow]
  );

  const handleDiscardAll = useCallback(() => {
    for (const row of rows) {
      cleanupWindow(row.windowIdentifier);
    }
    proceed();
  }, [rows, cleanupWindow, proceed]);

  const handleCancel = useCallback(() => {
    const pending = useUnsavedChangesStore.getState().request;
    closeRequest();
    pending?.onCancel?.();
  }, [closeRequest]);

  if (!request) {
    return null;
  }

  const footer = (
    <>
      <Button sx={sx.cancelButton} onClick={handleCancel} data-testid="UnsavedChangesWindowsModal__cancel">
        {t("common.cancel")}
      </Button>
      <Button sx={sx.saveButton} onClick={handleDiscardAll} data-testid="UnsavedChangesWindowsModal__discardAll">
        {t("unsavedChanges.discardAllAndContinue")}
      </Button>
    </>
  );

  return (
    <Modal
      open
      showHeader={false}
      onCancel={handleCancel}
      onClose={handleCancel}
      buttons={footer}
      data-testid="UnsavedChangesWindowsModal__modal">
      <Box className="flex flex-col gap-3 px-2 py-4" data-testid="UnsavedChangesWindowsModal__body">
        <Typography className="text-base font-semibold" data-testid="UnsavedChangesWindowsModal__title">
          {t("unsavedChanges.windowsTitle")}
        </Typography>
        <Typography className="text-sm" data-testid="UnsavedChangesWindowsModal__description">
          {t("unsavedChanges.windowsDescription")}
        </Typography>
        <Box className="flex flex-col gap-2" data-testid="UnsavedChangesWindowsModal__rows">
          {rows.map((row) => (
            <Box
              key={row.windowIdentifier}
              className="flex items-center justify-between gap-3 rounded-lg bg-(--color-transparent-neutral-5) px-3 py-2"
              data-testid={`UnsavedChangesWindowsModal__row-${row.windowIdentifier}`}>
              <Box className="min-w-0 flex flex-col" data-testid="UnsavedChangesWindowsModal__rowTitle">
                <Typography className="truncate text-sm font-medium" data-testid="Typography__e24b38">
                  {row.title}
                </Typography>
                {row.hasGridEditing && (
                  <Typography className="text-xs opacity-70" data-testid="Typography__e24b38">
                    {t("unsavedChanges.gridEditingLabel")}
                  </Typography>
                )}
              </Box>
              <Box className="flex flex-shrink-0 gap-2" data-testid="Box__e24b38">
                {row.hasSavableForm && (
                  <Button
                    sx={sx.saveButton}
                    disabled={savingWindowIdentifier === row.windowIdentifier}
                    onClick={() => handleSaveWindow(row)}
                    data-testid={`UnsavedChangesWindowsModal__save-${row.windowIdentifier}`}>
                    {t("common.save")}
                  </Button>
                )}
                <Button
                  sx={sx.cancelButton}
                  onClick={() => handleDiscardWindow(row)}
                  data-testid={`UnsavedChangesWindowsModal__discard-${row.windowIdentifier}`}>
                  {t("unsavedChanges.discard")}
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  );
}

/**
 * Menu the user resolves before an app-level exit when some window still holds unsaved
 * changes. Mounted once, inside WindowProvider.
 */
export default function UnsavedChangesWindowsModal() {
  const hasRequest = useUnsavedChangesStore((s) => s.request !== null);
  if (!hasRequest) {
    return null;
  }
  return <OpenUnsavedChangesWindowsModal data-testid="OpenUnsavedChangesWindowsModal__modal" />;
}

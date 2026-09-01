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

import { useCallback, useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import AlertIcon from "@workspaceui/componentlibrary/src/assets/icons/alert-triangle.svg";
import type { TranslationKeys } from "@workspaceui/componentlibrary/src/locales/types";
import { useTranslation } from "@/hooks/useTranslation";
import { useWindowStore } from "@/stores/windowStore";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import { useUnsavedChangesStore } from "@/stores/unsavedChangesStore";
import { useSaveDirtyWindow } from "@/hooks/useSaveDirtyWindow";
import { buildDirtyWindowRows, type DirtyWindowRow } from "@/utils/window/dirtyWindowRows";
import { UNSAVED_CHANGES_MODAL_WIDTH, useUnsavedChangesStyles } from "@/components/UnsavedChanges/styles";

/**
 * Wording above the list. Once every window is resolved the menu stays open with an
 * explicit Continue instead of letting the held-back action through on its own.
 */
const getDescriptionKey = (isResolved: boolean): TranslationKeys => {
  if (isResolved) {
    return "unsavedChanges.allResolved";
  }
  return "unsavedChanges.windowsDescription";
};

/** Adds a window to the set of failed saves without mutating the previous state. */
const withFailure = (failures: ReadonlySet<string>, windowIdentifier: string): ReadonlySet<string> =>
  new Set(failures).add(windowIdentifier);

/** Removes a window from the set of failed saves without mutating the previous state. */
const withoutFailure = (failures: ReadonlySet<string>, windowIdentifier: string): ReadonlySet<string> => {
  const next = new Set(failures);
  next.delete(windowIdentifier);
  return next;
};

/**
 * One row per dirty window so a user in a hurry can save what matters, discard the rest,
 * or resolve everything at once from the footer.
 *
 * Inline grid rows only offer Discard: their save lives inside the Table component and is
 * not reachable through the per-tab action bus.
 *
 * Split from the exported component so the MUI theme hooks only run while the menu is on
 * screen: the wrapper is mounted for the whole session but the menu is rarely open.
 */
function OpenUnsavedChangesWindowsModal() {
  const { t } = useTranslation();
  const { sx } = useUnsavedChangesStyles();

  const request = useUnsavedChangesStore((s) => s.request);
  const closeRequest = useUnsavedChangesStore((s) => s.closeRequest);
  const dirtyWindows = useWindowStore((s) => s.dirtyWindows);
  const windows = useWindowStore((s) => s.windows);
  const cleanupWindow = useWindowStore((s) => s.cleanupWindow);
  const setWindowActive = useWindowStore((s) => s.setWindowActive);
  const windowsData = useMetadataZustandStore((s) => s.windowsData);
  const { saveWindow } = useSaveDirtyWindow();

  const [savingWindowIdentifier, setSavingWindowIdentifier] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [failures, setFailures] = useState<ReadonlySet<string>>(new Set<string>());

  const rows = useMemo(
    () => buildDirtyWindowRows(dirtyWindows, windows, windowsData),
    [dirtyWindows, windows, windowsData]
  );
  const savableRows = useMemo(() => rows.filter((row) => row.hasSavableForm), [rows]);
  const isBusy = isSavingAll || savingWindowIdentifier !== null;

  /** Closes the modal and runs the held-back action. */
  const proceed = useCallback(() => {
    const pending = useUnsavedChangesStore.getState().request;
    closeRequest();
    pending?.onProceed();
  }, [closeRequest]);

  const handleCancel = useCallback(() => {
    const pending = useUnsavedChangesStore.getState().request;
    closeRequest();
    pending?.onCancel?.();
  }, [closeRequest]);

  /**
   * A window that is not on screen cannot show its own error modal, so the failure has to
   * be reported here or the click would look like it did nothing.
   */
  const reportSaveResult = useCallback((row: DirtyWindowRow, succeeded: boolean) => {
    if (succeeded) {
      setFailures((prev) => withoutFailure(prev, row.windowIdentifier));
      return;
    }
    setFailures((prev) => withFailure(prev, row.windowIdentifier));
  }, []);

  const handleSaveWindow = useCallback(
    async (row: DirtyWindowRow) => {
      setSavingWindowIdentifier(row.windowIdentifier);
      try {
        reportSaveResult(row, await saveWindow(row.windowIdentifier));
      } finally {
        setSavingWindowIdentifier(null);
      }
    },
    [saveWindow, reportSaveResult]
  );

  const handleSaveAll = useCallback(async () => {
    setIsSavingAll(true);
    try {
      for (const row of savableRows) {
        reportSaveResult(row, await saveWindow(row.windowIdentifier));
      }
      // The memoised rows are stale by now: read the registry again to find out whether
      // anything is still pending (a failed save, or grid rows that can only be discarded).
      const { dirtyWindows: latestDirty, windows: latestWindows } = useWindowStore.getState();
      if (buildDirtyWindowRows(latestDirty, latestWindows, windowsData).length === 0) {
        proceed();
      }
    } finally {
      setIsSavingAll(false);
    }
  }, [savableRows, saveWindow, reportSaveResult, windowsData, proceed]);

  const handleDiscardWindow = useCallback(
    (row: DirtyWindowRow) => {
      setFailures((prev) => withoutFailure(prev, row.windowIdentifier));
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

  /** Takes the user to the window that refused to save, cancelling the exit. */
  const handleOpenWindow = useCallback(
    (row: DirtyWindowRow) => {
      setWindowActive({ windowIdentifier: row.windowIdentifier });
      handleCancel();
    },
    [setWindowActive, handleCancel]
  );

  if (!request) {
    return null;
  }

  const isResolved = rows.length === 0;

  const resolvedFooter = (
    <>
      <Button sx={sx.secondaryButton} onClick={handleCancel} data-testid="UnsavedChangesWindowsModal__cancel">
        {t("common.cancel")}
      </Button>
      <Button sx={sx.primaryButton} onClick={proceed} data-testid="UnsavedChangesWindowsModal__continue">
        {t("unsavedChanges.continue")}
      </Button>
    </>
  );

  const pendingFooter = (
    <>
      <Button
        sx={sx.secondaryButton}
        onClick={handleCancel}
        disabled={isBusy}
        data-testid="UnsavedChangesWindowsModal__cancel">
        {t("common.cancel")}
      </Button>
      <Button
        sx={sx.discardButton}
        onClick={handleDiscardAll}
        disabled={isBusy}
        data-testid="UnsavedChangesWindowsModal__discardAll">
        {t("unsavedChanges.discardAllAndContinue")}
      </Button>
      <Button
        sx={sx.primaryButton}
        onClick={handleSaveAll}
        disabled={isBusy || savableRows.length === 0}
        data-testid="UnsavedChangesWindowsModal__saveAll">
        {t("unsavedChanges.saveAllAndContinue")}
      </Button>
    </>
  );

  return (
    <Modal
      open
      showHeader
      HeaderIcon={AlertIcon}
      tittleHeader={t("unsavedChanges.windowsTitle")}
      width={UNSAVED_CHANGES_MODAL_WIDTH}
      onCancel={handleCancel}
      onClose={handleCancel}
      buttons={isResolved ? resolvedFooter : pendingFooter}
      data-testid="UnsavedChangesWindowsModal__modal">
      <Box sx={sx.body} data-testid="UnsavedChangesWindowsModal__body">
        <Typography sx={sx.description} data-testid="UnsavedChangesWindowsModal__description">
          {t(getDescriptionKey(isResolved))}
        </Typography>
        {!isResolved && (
          <Box sx={sx.rows} data-testid="UnsavedChangesWindowsModal__rows">
            {rows.map((row) => (
              <Box
                key={row.windowIdentifier}
                sx={sx.row}
                data-testid={`UnsavedChangesWindowsModal__row-${row.windowIdentifier}`}>
                <Box sx={sx.rowHeader} data-testid="UnsavedChangesWindowsModal__rowHeader">
                  <Box sx={sx.rowLabels} data-testid="UnsavedChangesWindowsModal__rowTitle">
                    <Typography sx={sx.rowTitle} data-testid="Typography__e24b38">
                      {row.title}
                    </Typography>
                    {row.hasGridEditing && (
                      <Typography sx={sx.rowHint} data-testid="Typography__e24b38">
                        {t("unsavedChanges.gridEditingLabel")}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={sx.rowActions} data-testid="Box__e24b38">
                    <Button
                      sx={sx.rowDiscardButton}
                      disabled={isBusy}
                      onClick={() => handleDiscardWindow(row)}
                      data-testid={`UnsavedChangesWindowsModal__discard-${row.windowIdentifier}`}>
                      {t("unsavedChanges.discard")}
                    </Button>
                    {row.hasSavableForm && (
                      <Button
                        sx={sx.rowPrimaryButton}
                        disabled={isBusy}
                        onClick={() => handleSaveWindow(row)}
                        data-testid={`UnsavedChangesWindowsModal__save-${row.windowIdentifier}`}>
                        {t("common.save")}
                      </Button>
                    )}
                  </Box>
                </Box>
                {failures.has(row.windowIdentifier) && (
                  <Box sx={sx.rowError} data-testid={`UnsavedChangesWindowsModal__error-${row.windowIdentifier}`}>
                    <Typography sx={sx.rowErrorText} data-testid="Typography__e24b38">
                      {t("unsavedChanges.rowSaveFailed")}
                    </Typography>
                    <Button
                      sx={sx.rowSecondaryButton}
                      onClick={() => handleOpenWindow(row)}
                      data-testid={`UnsavedChangesWindowsModal__open-${row.windowIdentifier}`}>
                      {t("unsavedChanges.openWindow")}
                    </Button>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
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

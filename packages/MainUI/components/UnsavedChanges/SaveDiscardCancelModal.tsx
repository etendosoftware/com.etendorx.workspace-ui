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

import { Box, Button, Typography } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import AlertIcon from "@workspaceui/componentlibrary/src/assets/icons/alert-triangle.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { UNSAVED_CHANGES_PROMPT_WIDTH, useUnsavedChangesStyles } from "@/components/UnsavedChanges/styles";

export interface SaveDiscardCancelModalProps {
  open: boolean;
  message: string;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  /** Heading override for callers whose decision is not about a single record. */
  title?: string;
  /** Label override, e.g. "Save changes" vs "Save and close". */
  saveLabel?: string;
  /** Label override, e.g. "Discard changes" vs "Close window". */
  discardLabel?: string;
}

type OpenModalProps = Omit<SaveDiscardCancelModalProps, "open">;

/**
 * Split from the exported component so the MUI theme hooks only run while the prompt is
 * on screen. Every tab mounts the guard, and most of them never open it.
 */
function OpenSaveDiscardCancelModal({
  message,
  isSaving,
  onSave,
  onDiscard,
  onCancel,
  title,
  saveLabel,
  discardLabel,
}: OpenModalProps) {
  const { t } = useTranslation();
  const { sx } = useUnsavedChangesStyles();

  const footer = (
    <>
      <Button sx={sx.secondaryButton} onClick={onCancel} data-testid="SaveDiscardCancelModal__cancel">
        {t("common.cancel")}
      </Button>
      <Button sx={sx.discardButton} onClick={onDiscard} data-testid="SaveDiscardCancelModal__discard">
        {discardLabel ?? t("unsavedChanges.discardChanges")}
      </Button>
      <Button sx={sx.primaryButton} onClick={onSave} disabled={isSaving} data-testid="SaveDiscardCancelModal__save">
        {saveLabel ?? t("unsavedChanges.saveChanges")}
      </Button>
    </>
  );

  return (
    <Modal
      open
      showHeader
      HeaderIcon={AlertIcon}
      tittleHeader={title ?? t("unsavedChanges.promptTitle")}
      width={UNSAVED_CHANGES_PROMPT_WIDTH}
      onCancel={onCancel}
      onClose={onCancel}
      buttons={footer}
      data-testid="SaveDiscardCancelModal__modal">
      <Box sx={sx.body} data-testid="SaveDiscardCancelModal__body">
        <Typography sx={sx.description} data-testid="SaveDiscardCancelModal__message">
          {message}
        </Typography>
      </Box>
    </Modal>
  );
}

/**
 * Three-way prompt for a transition that would drop unsaved changes.
 *
 * `ConfirmModal` only renders two buttons and hardcodes a trash icon on its primary
 * action, so the base `Modal` is used with a custom `buttons` footer instead.
 */
export default function SaveDiscardCancelModal({ open, ...props }: SaveDiscardCancelModalProps) {
  if (!open) {
    return null;
  }
  return <OpenSaveDiscardCancelModal {...props} data-testid="OpenSaveDiscardCancelModal__modal" />;
}

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
import { useStyles } from "@workspaceui/componentlibrary/src/components/BasicModal/styles";
import { useTranslation } from "@/hooks/useTranslation";

export interface SaveDiscardCancelModalProps {
  open: boolean;
  message: string;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

type OpenModalProps = Omit<SaveDiscardCancelModalProps, "open">;

/**
 * Split from the exported component so the MUI theme hooks only run while the prompt is
 * on screen. Every tab mounts the guard, and most of them never open it.
 */
function OpenSaveDiscardCancelModal({ message, isSaving, onSave, onDiscard, onCancel }: OpenModalProps) {
  const { t } = useTranslation();
  const { sx } = useStyles();

  const footer = (
    <>
      <Button sx={sx.cancelButton} onClick={onCancel} data-testid="SaveDiscardCancelModal__cancel">
        {t("common.cancel")}
      </Button>
      <Button sx={sx.cancelButton} onClick={onDiscard} data-testid="SaveDiscardCancelModal__discard">
        {t("unsavedChanges.discard")}
      </Button>
      <Button sx={sx.saveButton} onClick={onSave} disabled={isSaving} data-testid="SaveDiscardCancelModal__save">
        {t("common.save")}
      </Button>
    </>
  );

  return (
    <Modal
      open
      showHeader={false}
      onCancel={onCancel}
      onClose={onCancel}
      buttons={footer}
      data-testid="SaveDiscardCancelModal__modal">
      <Box className="px-2 py-4" data-testid="SaveDiscardCancelModal__body">
        <Typography className="text-sm" data-testid="SaveDiscardCancelModal__message">
          {message}
        </Typography>
      </Box>
    </Modal>
  );
}

/**
 * Three-way prompt for an in-window transition that would drop unsaved changes.
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

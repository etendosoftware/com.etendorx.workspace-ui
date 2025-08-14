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

import { useMemo, memo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { Modal } from "..";
import SaveIcon from "../../assets/icons/trash.svg";
import { useStyle } from "../StatusModal/styles";
import type { ConfirmModalProps } from "./types";

const ConfirmModal = memo(
  ({
    confirmText,
    onConfirm,
    onCancel,
    saveLabel = "Confirm",
    secondaryButtonLabel = "Cancel",
    open = true,
  }: ConfirmModalProps) => {
    const theme = useTheme();
    const { sx } = useStyle();

    const backgroundGradient = useMemo(
      () => `linear-gradient(to bottom, ${theme.palette.specificColor.warning.light}, rgba(255, 255, 255, 0))`,
      [theme.palette.specificColor.warning.light]
    );
    return (
      <Modal
        open={open}
        showHeader={false}
        saveButtonLabel={saveLabel}
        secondaryButtonLabel={secondaryButtonLabel}
        SaveIcon={SaveIcon}
        backgroundGradient={backgroundGradient}
        onSave={onConfirm}
        onCancel={onCancel}>
        <Box sx={sx.statusModalContainer}>
          <Typography sx={sx.statusText}>{confirmText}</Typography>
        </Box>
      </Modal>
    );
  }
);

ConfirmModal.displayName = "ConfirmModal";

export default ConfirmModal;

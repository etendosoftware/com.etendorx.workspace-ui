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

import { memo } from "react";
import { Box, Typography } from "@mui/material";
import { Modal } from "..";
import SaveIcon from "../../assets/icons/trash.svg";
import { useStyle } from "../StatusModal/styles";
import { statusConfig } from "./states";
import StatusIconBadge from "./StatusIconBadge";
import type { ConfirmModalProps } from "./types";

const ConfirmModal = memo(
  ({
    confirmText,
    onConfirm,
    onCancel,
    saveLabel = "Confirm",
    secondaryButtonLabel = "Cancel",
    hideSecondaryButton = false,
    open = true,
  }: ConfirmModalProps) => {
    const { sx } = useStyle();
    const { iconBackgroundColor, icon: WarningIcon } = statusConfig.warning;
    return (
      <Modal
        open={open}
        showHeader={false}
        saveButtonLabel={saveLabel}
        secondaryButtonLabel={hideSecondaryButton ? undefined : secondaryButtonLabel}
        SaveIcon={SaveIcon}
        autoFocusSave
        onSave={onConfirm}
        onCancel={onCancel}>
        <Box sx={sx.statusModalContainer}>
          <StatusIconBadge color={iconBackgroundColor} Icon={WarningIcon} data-testid="StatusIconBadge__confirm" />
          <Typography sx={sx.statusText}>{confirmText}</Typography>
        </Box>
      </Modal>
    );
  }
);

ConfirmModal.displayName = "ConfirmModal";

export default ConfirmModal;

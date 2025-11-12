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

import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { useTranslation } from "@/hooks/useTranslation";

// Import icons
import AlertTriangleIcon from "../../../../ComponentLibrary/src/assets/icons/alert-triangle.svg";
import InfoIcon from "../../../../ComponentLibrary/src/assets/icons/info.svg";
import CheckCircleIcon from "../../../../ComponentLibrary/src/assets/icons/check-circle.svg";

export type ConfirmationDialogType = 'warning' | 'info' | 'success' | 'error';

interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Dialog type affects icon and styling */
  type?: ConfirmationDialogType;
  /** Dialog title */
  title: string;
  /** Dialog message content */
  message: string;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Whether the confirm button should be disabled */
  confirmDisabled?: boolean;
  /** Whether to show the cancel button */
  showCancel?: boolean;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Callback when user cancels or closes */
  onCancel: () => void;
}

/**
 * ConfirmationDialog component for user confirmations in inline editing
 * Used for confirming actions like discarding unsaved changes, saving with errors, etc.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  type = 'warning',
  title,
  message,
  confirmText,
  cancelText,
  confirmDisabled = false,
  showCancel = true,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  // Get icon and colors based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangleIcon className="w-6 h-6 text-yellow-600" />,
          confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
          defaultConfirmText: "Continue"
        };
      case 'error':
        return {
          icon: <AlertTriangleIcon className="w-6 h-6 text-red-600" />,
          confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
          defaultConfirmText: "Retry"
        };
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
          confirmButtonClass: "bg-green-600 hover:bg-green-700 text-white",
          defaultConfirmText: t("common.ok")
        };
      case 'info':
      default:
        return {
          icon: <InfoIcon className="w-6 h-6 text-blue-600" />,
          confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
          defaultConfirmText: t("common.ok")
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <div className="flex items-center gap-3">
          {typeConfig.icon}
          <span className="text-lg font-semibold">
            {title}
          </span>
        </div>
      </DialogTitle>

      <DialogContent>
        <p className="text-gray-700 whitespace-pre-line">
          {message}
        </p>
      </DialogContent>

      <DialogActions>
        {showCancel && (
          <Button
            onClick={onCancel}
            color="inherit"
          >
            {cancelText || t("common.cancel")}
          </Button>
        )}
        <Button
          onClick={onConfirm}
          disabled={confirmDisabled}
          variant="contained"
          color={type === 'error' ? 'error' : type === 'success' ? 'success' : 'primary'}
        >
          {confirmText || typeConfig.defaultConfirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
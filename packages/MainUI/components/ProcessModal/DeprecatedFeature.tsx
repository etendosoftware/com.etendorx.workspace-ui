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

import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { ProcessDeprecatedModallProps } from "./types";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import WarningIcon from "../../../ComponentLibrary/src/assets/icons/alert-triangle.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";
import { Button } from "@mui/material";

const DeprecatedFeatureModal = ({ isOpen, onClose, title, message }: ProcessDeprecatedModallProps) => {
  const { t } = useTranslation();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      <div className="relative bg-white flex flex-col w-full max-w-md border-4 border-gray-300 rounded-xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 rounded-t-xl bg-[var(--color-baseline-10)]">
          <h2 className="text-lg font-semibold">{title || t("common.processTitle")}</h2>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <WarningIcon fill="red" width="2rem" height="2rem" />
          </div>
          <p className="text-center text-lg font-medium mb-4">{message || t("common.notImplemented")}</p>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-center rounded-b-xl bg-[var(--color-baseline-10)]">
          <Button onClick={handleClose} variant="contained">
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeprecatedFeatureModal;

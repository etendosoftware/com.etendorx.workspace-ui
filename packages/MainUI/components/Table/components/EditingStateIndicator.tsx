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
import { useTranslation } from "@/hooks/useTranslation";

interface EditingStateIndicatorProps {
  isEditing: boolean;
  isSaving: boolean;
  hasErrors: boolean;
  errorCount?: number;
  className?: string;
}

/**
 * Visual indicator component that shows the current editing state of a row
 * Provides clear feedback about editing, saving, and error states
 */
export const EditingStateIndicator: React.FC<EditingStateIndicatorProps> = ({
  isEditing,
  isSaving,
  hasErrors,
  errorCount = 0,
  className = "",
}) => {
  const { t } = useTranslation();

  if (!isEditing) {
    return null;
  }

  if (isSaving) {
    return (
      <div className={`editing-state-indicator saving ${className}`} title={t("table.editing.saving")}>
        <div className="inline-edit-saving-spinner" />
        <span className="state-text">{t("table.editing.saving")}</span>
      </div>
    );
  }

  if (hasErrors) {
    const errorText = errorCount > 1 
      ? t("table.editing.multipleErrors", { count: errorCount })
      : t("table.editing.hasError");
    
    return (
      <div className={`editing-state-indicator error ${className}`} title={errorText}>
        <div className="error-icon">⚠</div>
        <span className="state-text">
          {errorText}
        </span>
      </div>
    );
  }

  return (
    <div className={`editing-state-indicator editing ${className}`} title={t("table.editing.inProgress")}>
      <div className="editing-icon">✎</div>
      <span className="state-text">{t("table.editing.inProgress")}</span>
    </div>
  );
};

export default EditingStateIndicator;
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

import type { Field } from "@workspaceui/api-client/src/api/types";
import StatusBarField from "@/components/Form/FormView/StatusBarField";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useCallback, useEffect, useState } from "react";
import { useTabContext } from "@/contexts/tab";
import { RecordNavigationControls } from "./RecordNavigationControls";
import type { NavigationState } from "@/hooks/useRecordNavigation";

interface StatusBarProps {
  fields: Record<string, Field>;
  navigationState?: NavigationState;
  onNavigateNext?: () => Promise<void>;
  onNavigatePrevious?: () => Promise<void>;
  isNavigating?: boolean;
}

export default function StatusBar({
  fields,
  navigationState,
  onNavigateNext,
  onNavigatePrevious,
  isNavigating = false,
}: StatusBarProps) {
  const [saveCounter, setSaveCounter] = useState(0);
  const { t } = useTranslation();
  const { onBack, onSave } = useToolbarContext();
  const { hasFormChanges } = useTabContext();

  const handleCloseRecord = useCallback(async () => {
    try {
      if (hasFormChanges) {
        await onSave(false);
      }
      setSaveCounter((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving record", error);
    }
  }, [hasFormChanges, onSave]);

  useEffect(() => {
    if (saveCounter > 0) {
      onBack();
    }
  }, [saveCounter, onBack]);

  return (
    <div
      data-testid="status-bar-container"
      className="h-10 flex items-center justify-between bg-gray-100/50 shadow px-3 py-2 rounded-xl">
      <div className="flex gap-4 text-sm overflow-x-auto whitespace-nowrap min-w-0 scrollbar-hide">
        {Object.entries(fields).map(([key, field]) => (
          <StatusBarField key={key} field={field} data-testid="StatusBarField__cfc328" />
        ))}
      </div>
      <div className="flex items-center gap-2">
        {onNavigateNext && onNavigatePrevious && (
          <RecordNavigationControls
            onNext={onNavigateNext}
            onPrevious={onNavigatePrevious}
            canNavigateNext={navigationState?.canNavigateNext ?? false}
            canNavigatePrevious={navigationState?.canNavigatePrevious ?? false}
            currentIndex={navigationState?.currentIndex ?? -1}
            totalRecords={navigationState?.totalRecords ?? 0}
            isNavigating={isNavigating}
            data-testid="RecordNavigationControls__cfc328"
          />
        )}
        <IconButton
          data-testid="icon-button"
          onClick={handleCloseRecord}
          className="w-8 h-8"
          tooltip={t("forms.statusBar.closeRecord")}
          disabled={false}>
          <CloseIcon data-testid="CloseIcon__cfc328" />
        </IconButton>
      </div>
    </div>
  );
}

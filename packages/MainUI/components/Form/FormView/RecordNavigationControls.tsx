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

import { IconButton } from "@workspaceui/componentlibrary/src/components";
import ChevronLeftIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-left.svg";
import ChevronRightIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import { useTranslation } from "@/hooks/useTranslation";

interface RecordNavigationControlsProps {
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  canNavigateNext: boolean;
  canNavigatePrevious: boolean;
  currentIndex: number;
  totalRecords: number;
  isNavigating: boolean;
}

export function RecordNavigationControls({
  onNext,
  onPrevious,
  canNavigateNext,
  canNavigatePrevious,
  currentIndex,
  totalRecords,
  isNavigating,
}: RecordNavigationControlsProps) {
  const { t } = useTranslation();

  // Show position indicator even when no records available
  const hasRecords = totalRecords > 0 && currentIndex !== -1;
  const displayPosition = hasRecords ? `${currentIndex + 1} / ${totalRecords}` : "- / -";

  // Disable buttons when no records or when navigating
  const buttonsDisabled = !hasRecords || isNavigating;

  return (
    <div className="flex items-center gap-2" data-testid="record-navigation-controls">
      <IconButton
        data-testid="previous-record-button"
        onClick={onPrevious}
        tooltip={t("forms.statusBar.previousRecord")}
        disabled={buttonsDisabled || !canNavigatePrevious}>
        <ChevronLeftIcon data-testid="ChevronLeftIcon__navigation" />
      </IconButton>
      <span
        className="text-sm text-gray-600 min-w-[60px] text-center select-none"
        data-testid="record-position-indicator">
        {displayPosition}
      </span>
      <IconButton
        data-testid="next-record-button"
        onClick={onNext}
        tooltip={t("forms.statusBar.nextRecord")}
        disabled={buttonsDisabled || !canNavigateNext}>
        <ChevronRightIcon data-testid="ChevronRightIcon__navigation" />
      </IconButton>
    </div>
  );
}

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
import { useToolbarCommands } from "@/contexts/ToolbarContext";
import { RecordNavigationControls } from "./RecordNavigationControls";
import type { NavigationState } from "@/hooks/useRecordNavigation";
import { SHORTCUT_IDS } from "@/utils/keyboard/shortcutIds";
import { withShortcutHint } from "@/utils/keyboard/shortcutRegistry";
import { useTopBarSlots } from "@/contexts/TitleActionsSlot";
import { useTabContext } from "@/contexts/tab";
import { useToolbarExtrasSlot } from "@/contexts/ToolbarExtrasSlot";
import { createPortal } from "react-dom";

interface StatusBarProps {
  fields: Record<string, Field>;
  navigationState?: NavigationState;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  isNavigating?: boolean;
}

export default function StatusBar({
  fields,
  navigationState,
  onNavigateNext,
  onNavigatePrevious,
  isNavigating = false,
}: StatusBarProps) {
  const { t } = useTranslation();
  // Same action as Ctrl+Shift+X (classic ToolBar_SaveClose), registered by FormActions.
  const { onSaveAndClose } = useToolbarCommands();
  const { pagination: topBarPaginationSlot } = useTopBarSlots();
  const { tab } = useTabContext();
  const { slot: toolbarExtrasSlot } = useToolbarExtrasSlot();
  // The root tab's record pagination goes to the top bar; a child tab's goes to its own toolbar.
  const paginationSlot = tab?.tabLevel === 0 ? topBarPaginationSlot : toolbarExtrasSlot;
  const hasStatusFields = Object.keys(fields).length > 0;

  const navigation = (
    <div className="flex items-center gap-2" data-testid="record-navigation">
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
        onClick={onSaveAndClose}
        className="w-8 h-8"
        tooltip={withShortcutHint(t("forms.statusBar.closeRecord"), SHORTCUT_IDS.TOOLBAR_SAVE_CLOSE)}
        disabled={false}>
        <CloseIcon data-testid="CloseIcon__cfc328" />
      </IconButton>
    </div>
  );

  // With the top bar available, pagination and close live there and this row only exists for status fields.
  if (paginationSlot) {
    return (
      <>
        {createPortal(navigation, paginationSlot)}
        {hasStatusFields && (
          <div
            data-testid="status-bar-container"
            className="flex h-8 items-center gap-4 overflow-x-auto whitespace-nowrap px-1 text-sm scrollbar-hide">
            {Object.entries(fields).map(([key, field]) => (
              <StatusBarField key={key} field={field} data-testid="StatusBarField__cfc328" />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div
      data-testid="status-bar-container"
      className="h-10 flex items-center justify-between bg-gray-100/50 shadow px-3 py-2 rounded-xl">
      <div className="flex gap-4 text-sm overflow-x-auto whitespace-nowrap min-w-0 scrollbar-hide">
        {Object.entries(fields).map(([key, field]) => (
          <StatusBarField key={key} field={field} data-testid="StatusBarField__cfc328" />
        ))}
      </div>
      {navigation}
    </div>
  );
}

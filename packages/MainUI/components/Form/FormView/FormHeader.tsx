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

import { useMemo } from "react";
import { useTheme } from "@mui/material";
import Info from "@workspaceui/componentlibrary/src/assets/icons/info.svg";
import PrimaryTabs from "@workspaceui/componentlibrary/src/components/PrimaryTab";
import type { TabItem } from "@workspaceui/componentlibrary/src/components/PrimaryTab/types";
import StatusModal from "@workspaceui/componentlibrary/src/components/StatusModal";
import { useFormViewContext } from "./contexts/FormViewContext";
import StatusBar from "./StatusBar";
import { useTranslation } from "@/hooks/useTranslation";
import type { Field } from "@workspaceui/api-client/src/api/types";
import type { StatusModalState } from "@workspaceui/componentlibrary/src/components/StatusModal/types";
import type { NavigationState } from "@/hooks/useRecordNavigation";

interface FormHeaderProps {
  statusBarFields: Record<string, Field>;
  groups: Array<[string | null, { identifier: string; fields: Record<string, Field> }]>;
  statusModal: StatusModalState;
  hideStatusModal: () => void;
  navigationState?: NavigationState;
  onNavigateNext?: () => Promise<void>;
  onNavigatePrevious?: () => Promise<void>;
  isNavigating?: boolean;
}

export function FormHeader({
  statusBarFields,
  groups,
  statusModal,
  hideStatusModal,
  navigationState,
  onNavigateNext,
  onNavigatePrevious,
  isNavigating,
}: FormHeaderProps) {
  const theme = useTheme();
  const { selectedTab, handleTabChange, getIconForGroup } = useFormViewContext();

  const defaultIcon = useMemo(
    () => <Info fill={theme.palette.baselineColor.neutral[80]} data-testid="Info__cb26f1" />,
    [theme.palette.baselineColor.neutral]
  );

  const { t } = useTranslation();

  const tabs: TabItem[] = useMemo(() => {
    return groups.map(([id, group]) => ({
      id: String(id || "_main"),
      icon: getIconForGroup(group.identifier),
      label: group.identifier === "More Information" ? t("forms.sections.moreInformation") : group.identifier,
      fill: theme.palette.baselineColor.neutral[80],
      hoverFill: theme.palette.baselineColor.neutral[0],
      showInTab: true,
    }));
  }, [groups, getIconForGroup, theme.palette.baselineColor.neutral, t]);

  return (
    <>
      {statusModal.open && (
        <StatusModal
          statusType={statusModal.statusType}
          statusText={statusModal.statusText}
          errorMessage={statusModal.errorMessage}
          saveLabel={statusModal.saveLabel}
          secondaryButtonLabel={statusModal.secondaryButtonLabel}
          onClose={hideStatusModal}
          isDeleteSuccess={statusModal.isDeleteSuccess}
          data-testid="StatusModal__cb26f1"
        />
      )}
      <StatusBar
        fields={statusBarFields}
        navigationState={navigationState}
        onNavigateNext={onNavigateNext}
        onNavigatePrevious={onNavigatePrevious}
        isNavigating={isNavigating}
        data-testid="StatusBar__cb26f1"
      />
      <PrimaryTabs
        tabs={tabs}
        onChange={handleTabChange}
        selectedTab={selectedTab}
        icon={defaultIcon}
        data-testid="PrimaryTabs__cb26f1"
      />
    </>
  );
}

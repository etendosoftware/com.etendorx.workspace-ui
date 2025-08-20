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
import type { Field } from "@workspaceui/api-client/src/api/types";
import type { StatusModalState } from "@workspaceui/componentlibrary/src/components/StatusModal/types";

interface FormHeaderProps {
  statusBarFields: Record<string, Field>;
  groups: Array<[string | null, { identifier: string; fields: Record<string, Field> }]>;
  statusModal: StatusModalState;
  hideStatusModal: () => void;
}

export function FormHeader({ statusBarFields, groups, statusModal, hideStatusModal }: FormHeaderProps) {
  const theme = useTheme();
  const { selectedTab, handleTabChange, getIconForGroup } = useFormViewContext();

  const defaultIcon = useMemo(
    () => <Info fill={theme.palette.baselineColor.neutral[80]} />,
    [theme.palette.baselineColor.neutral]
  );

  const tabs: TabItem[] = useMemo(() => {
    return groups.map(([id, group]) => ({
      id: String(id || "_main"),
      icon: getIconForGroup(group.identifier),
      label: group.identifier,
      fill: theme.palette.baselineColor.neutral[80],
      hoverFill: theme.palette.baselineColor.neutral[0],
      showInTab: true,
    }));
  }, [groups, getIconForGroup, theme.palette.baselineColor.neutral]);

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
        />
      )}
      <StatusBar fields={statusBarFields} />
      <PrimaryTabs tabs={tabs} onChange={handleTabChange} selectedTab={selectedTab} icon={defaultIcon} />
    </>
  );
}

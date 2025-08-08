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

import type { Tab } from "@workspaceui/api-client/src/api/types";

export type TabsProps = { tabs: Tab[] };
export type TabsSwitchProps = {
  current: Tab;
  tabs: Tab[];
  activeTabId?: string;
  collapsed?: boolean;
  onClick: (tab: Tab) => void;
  onDoubleClick: (tab: Tab) => void;
  onClose: () => void;
};
export type TabSwitchProps = {
  tab: Tab;
  active: boolean;
  onClick: (tab: Tab) => void;
  onDoubleClick: (tab: Tab) => void;
  isWindow?: boolean;
  showIcon?: boolean;
  onClose?: (e: React.MouseEvent) => void;
  canClose?: boolean;
};

export type TabLevelProps = { tab: Tab; collapsed?: boolean };

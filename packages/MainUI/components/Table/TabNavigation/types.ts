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

import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";

export interface SelectedRecord extends EntityData {}

export type IsMainTab = boolean;

export interface TabProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecord: SelectedRecord | null;
  noIdentifierLabel?: string;
  noTypeLabel?: string;
  handleFullSize: () => void;
  isFullSize: boolean;
  tab?: Tab;
  childTabs?: Tab[];
  windowId?: string;
  isMainTab?: IsMainTab;
}

export interface TabContentProps {
  identifier: string | null;
  type: string | null;
  onClose: () => void;
  handleFullSize: () => void;
  isFullSize: boolean;
  tab?: Tab;
  selectedRecord?: SelectedRecord;
  isMainTab?: IsMainTab;
}

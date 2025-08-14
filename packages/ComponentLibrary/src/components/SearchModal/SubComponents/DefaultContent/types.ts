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

import type { ReactNode } from "react";

export interface Item {
  name: string;
  icon: ReactNode;
  isNew?: boolean;
  newLabel?: string;
}

export interface Section {
  title: string;
  items: Item[];
}

export interface TabContent {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  items: Item[];
}

export interface SearchModalProps {
  defaultContent?: Section[];
  tabsContent: TabContent[];
  variant: "default" | "tabs";
}

export interface DefaultContentProps {
  sections: Section[];
}

export interface TabContentProps {
  tabsContent: TabContent[];
  activeTab: number;
}

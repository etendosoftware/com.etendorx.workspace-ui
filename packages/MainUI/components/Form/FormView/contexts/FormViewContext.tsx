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

import { createContext, useContext } from "react";
import type { Tab, WindowMetadata, FormMode } from "@workspaceui/api-client/src/api/types";

export interface FormViewContextValue {
  window?: WindowMetadata;
  tab: Tab;
  mode: FormMode;
  recordId: string | undefined;
  setRecordId: (recordId: string) => void;
  expandedSections: string[];
  setExpandedSections: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
  isFormInitializing: boolean;
  setIsFormInitializing: React.Dispatch<React.SetStateAction<boolean>>;
  handleSectionRef: (sectionId: string | null) => (el: HTMLElement | null) => void;
  handleAccordionChange: (sectionId: string | null, isExpanded: boolean) => void;
  handleTabChange: (newTabId: string) => void;
  isSectionExpanded: (sectionId: string | null) => boolean;
  getIconForGroup: (identifier: string) => React.ReactElement;
}

export const FormViewContext = createContext<FormViewContextValue | undefined>(undefined);

export const useFormViewContext = () => {
  const context = useContext(FormViewContext);
  if (!context) {
    throw new Error("useFormViewContext must be used within a FormViewProvider");
  }
  return context;
};

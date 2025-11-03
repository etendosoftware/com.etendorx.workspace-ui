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

import { createContext, useContext, type ReactNode } from "react";
import { useAttachmentInfo, type AttachmentInfo } from "@/hooks/attachments/useAttachmentInfo";
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";

interface AttachmentContextType {
  fetchAttachmentInfo: (record: EntityData, tab: Tab) => Promise<AttachmentInfo | null>;
  clearCache: () => void;
  attachmentCache: Map<string, AttachmentInfo>;
}

const AttachmentContext = createContext<AttachmentContextType | undefined>(undefined);

export const AttachmentProvider = ({ children }: { children: ReactNode }) => {
  const attachmentHook = useAttachmentInfo();

  return <AttachmentContext.Provider value={attachmentHook}>{children}</AttachmentContext.Provider>;
};

export const useAttachmentContext = () => {
  const context = useContext(AttachmentContext);
  if (!context) {
    throw new Error("useAttachmentContext must be used within AttachmentProvider");
  }
  return context;
};

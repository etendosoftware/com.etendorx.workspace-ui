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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { useCallback } from "react";
import { toast } from "sonner";
import type { RecentDocumentItem } from "@workspaceui/api-client/src/api/dashboard";
import { useLanguage } from "@/contexts/language";
import { useTranslation } from "@/hooks/useTranslation";
import { useRedirect } from "@/hooks/navigation/useRedirect";
import { useRecentDocumentsStore } from "@/stores/recentDocumentsStore";
import { resolveCatalogLabel } from "@/utils/catalogLabel";
import { recordExists } from "@/utils/window/recordExists";

/** `AD_MESSAGE` shown when a recent document points to a record that was deleted. */
export const RECORD_NO_LONGER_EXISTS_MESSAGE = "ETMETA_RecordNoLongerExists";

/**
 * Opens a recent document on its record. When the record was deleted the user is told so, no form is opened
 * and the document leaves the list, instead of opening an empty form that looks new.
 *
 * @returns Click handler of a recent document
 */
export function useOpenRecentDocument() {
  const { handleClickRedirect } = useRedirect();
  const { getLabel } = useLanguage();
  const { t } = useTranslation();
  const removeDocument = useRecentDocumentsStore((s) => s.remove);

  return useCallback(
    async (e: React.MouseEvent, doc: RecentDocumentItem) => {
      // The record is looked up before opening, so the default action must not run meanwhile.
      e.preventDefault();
      e.stopPropagation();

      if (await recordExists({ windowId: doc.windowId, tabId: doc.tabId, recordId: doc.recordId })) {
        await handleClickRedirect({
          e,
          windowId: doc.windowId,
          windowTitle: doc.windowTitle,
          referencedTabId: doc.tabId,
          selectedRecordId: doc.recordId,
          tabLevel: doc.tabLevel,
        });
        return;
      }

      toast.warning(
        resolveCatalogLabel(RECORD_NO_LONGER_EXISTS_MESSAGE, "dashboard.recentDocuments.recordNoLongerExists", {
          getLabel,
          t,
        })
      );
      await removeDocument(doc.tabId, doc.recordId);
    },
    [handleClickRedirect, getLabel, t, removeDocument]
  );
}

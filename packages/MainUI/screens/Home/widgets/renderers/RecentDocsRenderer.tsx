/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance
 * with the License.
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

"use client";

import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRecentDocuments } from "@/hooks/useRecentDocuments";
import { useRedirect } from "@/hooks/navigation/useRedirect";

export default function RecentDocsRenderer() {
  const { t } = useTranslation();
  const { documents } = useRecentDocuments();
  const { handleClickRedirect } = useRedirect();

  const handleClick = useCallback(
    (e: React.MouseEvent, doc: (typeof documents)[number]) => {
      handleClickRedirect({
        e,
        windowId: doc.windowId,
        windowTitle: doc.windowTitle,
        referencedTabId: doc.tabId,
        selectedRecordId: doc.recordId,
        tabLevel: doc.tabLevel,
      });
    },
    [handleClickRedirect]
  );

  if (documents.length === 0) {
    return (
      <p className="text-sm text-baseline-50" data-testid="RecentDocsRenderer__empty">
        {t("dashboard.recentDocuments.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="RecentDocsRenderer__list">
      {documents.map((doc) => (
        <button
          key={`${doc.windowId}-${doc.recordId}`}
          type="button"
          onClick={(e) => handleClick(e, doc)}
          className="rounded-full px-3 py-1 text-sm font-medium bg-transparent-neutral-5 hover:bg-transparent-neutral-10 text-baseline-100 border border-transparent-neutral-10 transition-colors cursor-pointer"
          data-testid={`RecentDocsRenderer__item_${doc.windowId}_${doc.recordId}`}>
          {doc.identifier}
        </button>
      ))}
    </div>
  );
}

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

import { useTranslation } from "@/hooks/useTranslation";
import { useRecentDocuments } from "@/hooks/useRecentDocuments";
import { useOpenRecentDocument } from "@/hooks/navigation/useOpenRecentDocument";
import { usePrefetchWindowOnHover } from "@/hooks/usePrefetchWindowOnHover";
import { WIDGET_CHIP_CLASSES, WIDGET_EMPTY_TEXT_CLASSES } from "./chipClasses";

export default function RecentDocsRenderer() {
  const { t } = useTranslation();
  const { documents } = useRecentDocuments();
  const handleClick = useOpenRecentDocument();
  const prefetchOnHover = usePrefetchWindowOnHover();

  if (documents.length === 0) {
    return (
      <p className={WIDGET_EMPTY_TEXT_CLASSES} data-testid="RecentDocsRenderer__empty">
        {t("dashboard.recentDocuments.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid="RecentDocsRenderer__list">
      {documents.map((doc) => (
        <button
          // The store keeps one entry per window, tab and record: the same record seen in two tabs is two chips
          key={`${doc.windowId}-${doc.tabId}-${doc.recordId}`}
          type="button"
          onClick={(e) => handleClick(e, doc)}
          onMouseEnter={() => prefetchOnHover(doc.windowId)}
          onFocus={() => prefetchOnHover(doc.windowId)}
          className={WIDGET_CHIP_CLASSES}
          title={doc.identifier}
          data-testid={`RecentDocsRenderer__item_${doc.windowId}_${doc.recordId}`}>
          {doc.identifier}
        </button>
      ))}
    </div>
  );
}

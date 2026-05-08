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

"use client";

import { useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRecentDocuments } from "@/hooks/useRecentDocuments";
import { useWindowContext } from "@/contexts/window";
import { getNewWindowIdentifier } from "@/utils/window/utils";
import { TAB_MODES, FORM_MODES } from "@/utils/url/constants";

export default function RecentDocumentsWidget() {
  const { t } = useTranslation();
  const { documents } = useRecentDocuments();
  const { setWindowActive, setTabFormState, setSelectedRecord } = useWindowContext();

  const handleClick = useCallback(
    (doc: (typeof documents)[number]) => {
      const newWindowIdentifier = getNewWindowIdentifier(doc.windowId);
      setWindowActive({
        windowIdentifier: newWindowIdentifier,
        windowData: { title: doc.windowTitle, initialized: true },
      });
      setSelectedRecord(newWindowIdentifier, doc.tabId, doc.id, doc.tabLevel);
      setTabFormState(newWindowIdentifier, doc.tabId, {
        recordId: doc.id,
        mode: TAB_MODES.FORM,
        formMode: FORM_MODES.EDIT,
      });
    },
    [setWindowActive, setTabFormState, setSelectedRecord]
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-secondary-100 p-5 h-full min-h-40">
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-baseline-100">{t("dashboard.recentDocuments.title")}</span>
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-baseline-50">{t("dashboard.recentDocuments.empty")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <button
              key={`${doc.windowId}-${doc.id}`}
              type="button"
              onClick={() => handleClick(doc)}
              className="rounded-full px-3 py-1 text-sm font-medium bg-transparent-neutral-5 hover:bg-transparent-neutral-10 text-baseline-100 border border-transparent-neutral-10 transition-colors cursor-pointer">
              {doc.identifier}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

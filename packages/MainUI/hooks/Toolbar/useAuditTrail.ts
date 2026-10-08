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
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import { notifyReportPopupBlocked } from "@/utils/reportPopup";
import {
  AUDIT_TRAIL_STATUS,
  buildAuditTrailUrl,
  getAuditTrailStatus,
  openAuditTrailPopup,
} from "@/utils/toolbar/auditTrail";

const getSelectedRecordId = (selectedRecords: EntityData[]): string | undefined => {
  const [record] = selectedRecords;
  return record ? String(record.id) : undefined;
};

interface UseAuditTrailParams {
  tab?: Tab;
  selectedRecords: EntityData[];
  isNewRecord: boolean;
}

/**
 * Opens the classic Audit Trail popup, applying the same rules as `OB.ToolbarUtils.showAuditTrail`:
 * a multiple selection shows the JS28 warning, a new or never modified record does nothing, and
 * without a selection the popup opens without a record (its "View deleted records" view).
 * Its `ToolBar_Audit` shortcut presses the toolbar button (see `useToolbarShortcuts`).
 */
export const useAuditTrail = ({ tab, selectedRecords, isNewRecord }: UseAuditTrailParams) => {
  const { t } = useTranslation();
  const { config } = useRuntimeConfig();
  const token = useUserStore((s) => s.token);

  const openAuditTrail = useCallback(() => {
    if (!tab) return;
    const status = getAuditTrailStatus({ selectedRecords, isNewRecord });
    if (status === AUDIT_TRAIL_STATUS.MULTIPLE) {
      toast.warning(t("auditTrail.selectOneRecord"));
      return;
    }
    if (status !== AUDIT_TRAIL_STATUS.READY) return;

    const url = buildAuditTrailUrl({
      publicHost: config?.etendoClassicHost || "",
      tabId: tab.id,
      tableId: tab.table,
      recordId: getSelectedRecordId(selectedRecords),
      token,
    });
    if (!openAuditTrailPopup(url)) {
      notifyReportPopupBlocked(() => openAuditTrailPopup(url), {
        title: t("auditTrail.popupBlocked"),
        openLabel: t("auditTrail.openPopup"),
      });
    }
  }, [tab, selectedRecords, isNewRecord, t, config?.etendoClassicHost, token]);

  return { openAuditTrail };
};

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
import type { EntityData, Tab } from "@workspaceui/api-client/src/api/types";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import { notifyReportPopupBlocked } from "@/utils/reportPopup";
import { buildLegacyPrintUrl, openLegacyPrintPopup } from "@/utils/toolbar/print";

interface UseLegacyPrintParams {
  tab: Tab;
  selectedRecords: EntityData[];
}

/**
 * Prints through the classic `PrinterReports` page, as `OB.ToolbarUtils.print` does. Used for the
 * print processes that are not PrintController documents (`printConfig.legacy`), such as Business
 * Partner, Remittance or Tax Payment, whose output the document print service cannot generate.
 */
export const useLegacyPrint = ({ tab, selectedRecords }: UseLegacyPrintParams) => {
  const { t } = useTranslation();
  const { config } = useRuntimeConfig();
  const token = useUserStore((s) => s.token);

  const printLegacy = useCallback(() => {
    const printConfig = tab.printConfig;
    if (!printConfig || selectedRecords.length === 0) return;

    const url = buildLegacyPrintUrl({
      publicHost: config?.etendoClassicHost || "",
      tab,
      printConfig,
      recordIds: selectedRecords.map((record) => String(record.id)),
      token,
    });
    if (!openLegacyPrintPopup(url)) {
      notifyReportPopupBlocked(() => openLegacyPrintPopup(url), {
        title: t("print.popupBlocked"),
        openLabel: t("print.openPopup"),
      });
    }
  }, [tab, selectedRecords, t, config?.etendoClassicHost, token]);

  return { printLegacy };
};

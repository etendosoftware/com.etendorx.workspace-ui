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

import { useMemo } from "react";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { buildPayloadByInputName } from "@/utils";
import { buildContextString } from "@/utils/contextUtils";
import type { RecordContextData } from "./types";
import { useTranslation } from "./useTranslation";

/**
 * Context of the selected records for Copilot. Every mounted toolbar calls this on each selection change, and the
 * payloads (a pretty-printed JSON per record) are only read when Copilot is opened, so they are built on first
 * read of `contextItems` / `contextString` instead of on every selection.
 */
export const useRecordContext = (): RecordContextData => {
  const { tab } = useTabContext();
  const selectedRecords = useSelectedRecords(tab);
  const { t } = useTranslation();

  return useMemo(() => {
    let items: RecordContextData["contextItems"] | undefined;
    let text: string | undefined;

    const buildItems = () =>
      (selectedRecords ?? []).map((record) => {
        const payload = buildPayloadByInputName(record, tab.fields);
        const recordId = String(record.id);
        const tabIdentifier = tab.title || tab.name || "Tab";
        const recordIdentifier = record._identifier || recordId;

        return {
          id: `${String(tab.id)}-${recordId}`,
          label: `${tabIdentifier}-${String(recordIdentifier)}`,
          contextString: JSON.stringify(payload, null, 2),
          recordId,
        };
      });

    return {
      selectedRecords,
      hasSelectedRecords: selectedRecords.length > 0,
      get contextItems() {
        items ??= buildItems();
        return items;
      },
      get contextString() {
        text ??= buildContextString({
          contextItems: this.contextItems,
          registersText: t("copilot.contextPreview.selectedRegisters"),
        });
        return text;
      },
    };
  }, [selectedRecords, tab.fields, tab.id, tab.title, tab.name, t]);
};

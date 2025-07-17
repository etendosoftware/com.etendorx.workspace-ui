import { useMemo } from "react";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { buildPayloadByInputName } from "@/utils";
import { buildContextString } from "@/utils/contextUtils";
import type { RecordContextData } from "./types";
import { useTranslation } from "./useTranslation";

export const useRecordContext = (): RecordContextData => {
  const { tab } = useTabContext();
  const selectedRecords = useSelectedRecords(tab);
  const { t } = useTranslation();

  const contextItems = useMemo(() => {
    if (!selectedRecords || selectedRecords.length === 0) {
      return [];
    }

    return selectedRecords.map((record) => {
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
  }, [selectedRecords, tab.fields, tab.id, tab.title, tab.name]);

  const contextString = useMemo(() => {
    return buildContextString({
      contextItems,
      registersText: t("copilot.contextPreview.selectedRegisters"),
    });
  }, [contextItems, t]);

  return {
    selectedRecords,
    hasSelectedRecords: selectedRecords.length > 0,
    contextString,
    contextItems,
  };
};

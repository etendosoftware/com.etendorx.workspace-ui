import { useMemo } from "react";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { buildPayloadByInputName } from "@/utils";
import { CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";
import type { RecordContextData } from "./types";

export const useRecordContext = (): RecordContextData => {
  const { tab } = useTabContext();
  const selectedRecords = useSelectedRecords(tab);

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
    if (contextItems.length === 0) {
      return "";
    }

    const recordsData = contextItems.map((item) => item.contextString);
    return `${CONTEXT_CONSTANTS.TAG_START} (${contextItems.length} registro${contextItems.length > 1 ? "s" : ""}):\n\n${recordsData.join("\n\n---\n\n")}${CONTEXT_CONSTANTS.TAG_END}`;
  }, [contextItems]);

  return {
    selectedRecords,
    hasSelectedRecords: selectedRecords.length > 0,
    contextString,
    contextItems,
  };
};

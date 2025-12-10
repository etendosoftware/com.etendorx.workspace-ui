import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { COPY_RECORD_PROCESS_ID } from "./constants";
import type { ActionModalResponse } from "@/hooks/Toolbar/types";

export interface CopyRecordResponse {
  responseActions?: ActionModalResponse[];
  records?: Array<{ id: string }>;
  refreshParent?: boolean;
}

export const copyRecordRequest = async (
  tab: Tab,
  selectedIds: string[],
  windowId: string,
  cloneWithChildren: boolean
) => {
  const processId = COPY_RECORD_PROCESS_ID;
  const tabId = tab.id;
  const recordId = selectedIds[0];

  const options = { method: "POST" };

  const params = new URLSearchParams({
    processId,
    tabId,
    recordId,
    windowId,
    _action: "com.smf.jobs.defaults.CloneRecords",
  });

  const payload = {
    recordIds: [...selectedIds],
    _entityName: tab.entityName,
    _params: {
      copyChildren: cloneWithChildren,
    },
  };

  const { ok, data } = await Metadata.kernelClient.post(`?${params}`, payload, options);
  return { ok, data: data as CopyRecordResponse };
};

export const handleCopyRecordResponse = ({
  ok,
  data,
  onError,
  onRefreshParent,
  onSingleRecord,
  onMultipleRecords,
}: {
  ok: boolean;
  data: CopyRecordResponse;
  onError: () => void;
  onRefreshParent: () => void;
  onSingleRecord: (recordId: string) => void;
  onMultipleRecords: () => void;
}) => {
  const { responseActions, records, refreshParent } = data;

  if (!ok || responseActions?.some((action: ActionModalResponse) => action.showMsgInProcessView?.msgType === "error")) {
    onError();
    return;
  }

  if (refreshParent) {
    onRefreshParent();
  }

  if (records?.length === 1) {
    onSingleRecord(records[0].id);
    return;
  }

  onMultipleRecords();
};

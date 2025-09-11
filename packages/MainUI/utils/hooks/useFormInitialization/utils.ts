import type { ClientOptions } from "@workspaceui/api-client/src/api/client";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { FormMode, type Tab, type FormInitializationResponse } from "@workspaceui/api-client/src/api/types";
import { ACTION_FORM_INITIALIZATION } from "./constants";
import { logger } from "@/utils/logger";

const getRowId = (mode: FormMode, recordId?: string | null): string => {
  return mode === FormMode.EDIT ? (recordId ?? "null") : "null";
};

/**
 * Utility function to build form initialization parameters.
 * @param mode The form mode (NEW or EDIT).
 * @param tab The tab information.
 * @param recordId The ID of the record (optional).
 * @param parentId The ID of the parent record (optional).
 * @returns URLSearchParams containing the query parameters.
 */

export const buildFormInitializationParams = ({
  mode,
  tab,
  recordId,
  parentId,
}: {
  tab: Tab;
  mode: FormMode;
  recordId?: string | null;
  parentId?: string | null;
}): URLSearchParams =>
  new URLSearchParams({
    MODE: mode,
    PARENT_ID: parentId ?? "null",
    TAB_ID: tab.id,
    ROW_ID: getRowId(mode, recordId),
    _action: ACTION_FORM_INITIALIZATION,
  });

export const fetchFormInitialization = async (
  params: URLSearchParams,
  payload: ClientOptions["body"]
): Promise<FormInitializationResponse> => {
  try {
    const { data } = await Metadata.kernelClient.post(`?${params}`, payload);
    return data;
  } catch (error) {
    logger.warn("Error fetching initial form data:", error);
    throw new Error("Failed to fetch initial data");
  }
};

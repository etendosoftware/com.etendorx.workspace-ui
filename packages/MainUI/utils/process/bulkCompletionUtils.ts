/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import type { ProcessDefinition, ProcessParameters } from "../../components/ProcessModal/types";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

/**
 * Default onLoad script for Bulk Completion processes.
 * This script fetches available document actions based on the selected records' statuses.
 */
export const DEFAULT_BULK_COMPLETION_ONLOAD = `async (process, context) => {
  const selectedRecords = context.selectedRecords;
  const tabId = context?.tabId || '';

  const values = Object.values(selectedRecords);

  const documentStatuses = Array.from(new Set(values.map(record => record.documentStatus)));

  const isProcessing = values.some(record => (record.processing || record.isprocessing || 'N') === 'Y') ? 'Y' : '';

  const queryParams = new URLSearchParams({
    _action: \`\${process.javaClassName}Defaults\`,
  });

  const payload = {
    documentStatuses,
    isProcessing,
    tabId,
    tableId: context?.tableId || '',
  };

  const { ok, data, status } = await Metadata.kernelClient.post(\`?\${queryParams}\`, payload);

  if (!ok) {
    throw new Error(\`HTTP error! status: \${status}\`);
  }

  return {
    DocAction: data.actions,
  };
}`;

/**
 * Checks if a process should use the default Bulk Completion onLoad logic.
 * 
 * @param processDefinition - The process definition metadata
 * @param parameters - The process parameters
 * @returns True if the process is a Bulk Completion process without a custom onLoad script
 */
export const isBulkCompletionProcess = (
  processDefinition: ProcessDefinition,
  parameters: ProcessParameters
): boolean => {
  // If onLoad is already defined in metadata, don't override it
  if (processDefinition.onLoad) {
    return false;
  }

  // Bulk completion processes must allow multiple records
  const isMultiRecord = processDefinition.isMultiRecord === true || processDefinition.isMultiRecord === "Y";
  if (!isMultiRecord) {
    return false;
  }

  // Bulk completion processes typically have a DocAction parameter
  const params = Object.values(parameters) as ProcessParameter[];
  const hasDocAction = params.some(
    (p) => p.name === "DocAction" || p.dBColumnName === "DocAction"
  );

  return hasDocAction;
};

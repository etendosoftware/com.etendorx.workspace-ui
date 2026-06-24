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

import type { ProcessDefinition, ProcessParameters, ProcessParameter } from "@workspaceui/api-client/src/api/types";

/**
 * Column/name of the document-action parameter that drives the bulk flow.
 */
export const DOC_ACTION = "DocAction";

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
 * Identifies the document-action parameter that bulk processes render as their
 * single field.
 *
 * @param parameter - The process parameter to test
 * @returns True when the parameter is the document-action field
 */
export const isDocActionParameter = (parameter: ProcessParameter): boolean =>
  parameter.dBColumnName === DOC_ACTION || parameter.name === DOC_ACTION;

/**
 * Checks if a process should render as a Bulk Completion process (single
 * document-action field). This decision is independent of any onLoad script: the
 * parameter set is intrinsic to the process, so the presence of a migrated
 * onLoad must not change how the process is rendered.
 *
 * @param processDefinition - The process definition metadata
 * @param parameters - The process parameters
 * @returns True if the process is a Bulk Completion process
 */
export const isBulkCompletionProcess = (
  processDefinition: ProcessDefinition,
  parameters: ProcessParameters
): boolean => {
  // Bulk completion processes must allow multiple records
  const isMultiRecord = processDefinition.isMultiRecord === true || processDefinition.isMultiRecord === "Y";
  if (!isMultiRecord) {
    return false;
  }

  // Bulk completion processes typically have a DocAction parameter
  const params = Object.values(parameters) as ProcessParameter[];
  return params.some(isDocActionParameter);
};

/**
 * Builds the ordered list of onLoad scripts to run when a process modal opens.
 *
 * For Bulk Completion processes the default script runs first — it fetches the
 * valid document actions and filters the DocAction options — so the filtering is
 * applied for every bulk process regardless of whether it carries a custom
 * onLoad. A custom `etmetaOnload`, when present, runs afterwards for any
 * process-specific UI logic (it must not re-fetch the document actions).
 *
 * @param etmetaOnload - The process's migrated onLoad script, if any
 * @param isBulkCompletion - Whether the process renders as Bulk Completion
 * @returns The onLoad script bodies to execute, in order
 */
export const buildOnLoadScripts = (etmetaOnload: string | null | undefined, isBulkCompletion: boolean): string[] => {
  const scripts: string[] = [];
  if (isBulkCompletion) {
    scripts.push(DEFAULT_BULK_COMPLETION_ONLOAD);
  }
  if (etmetaOnload) {
    scripts.push(etmetaOnload);
  }
  return scripts;
};

/**
 * Decides whether a parameter is rendered while a process is shown in bulk mode.
 * The document-action field is always rendered; any other parameter is hidden by
 * default and only rendered once a script explicitly reveals it via `show()`.
 *
 * @param parameter - The process parameter to test
 * @param logicFields - The merged display/readonly flags (includes script flags)
 * @returns True if the parameter must be rendered in bulk mode
 */
export const isBulkParameterRenderable = (
  parameter: ProcessParameter,
  logicFields?: Record<string, boolean>
): boolean => {
  if (isDocActionParameter(parameter)) {
    return true;
  }

  const shownByName = logicFields?.[`${parameter.name}.display`] === true;
  const shownByColumn = logicFields?.[`${parameter.dBColumnName}.display`] === true;
  return shownByName || shownByColumn;
};

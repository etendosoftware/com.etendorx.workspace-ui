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

/**
 * @fileoverview Barrel re-export for ProcessDefinitionModal dependencies.
 * Centralizes all project-level imports so the main modal file stays focused on logic.
 */

// --- Contexts ---
export { useTabContext } from "@/contexts/tab";
export { useWindowContext, useWindowListContext } from "@/contexts/window";
export { useUserContext } from "@/hooks/useUserContext";

// --- Custom hooks ---
export { useProcessConfig } from "@/hooks/datasource/useProcessDatasourceConfig";
export { useProcessInitialization } from "@/hooks/useProcessInitialization";
export { useProcessInitializationState } from "@/hooks/useProcessInitialState";
export { useSelected } from "@/hooks/useSelected";
export { useTranslation } from "@/hooks/useTranslation";
export { useProcessCallouts } from "./callouts/useProcessCallouts";
export { useWarehousePlugin } from "./Custom/GenericWarehouseProcess";

// --- Next.js navigation ---
export { useRouter, useSearchParams } from "next/navigation";
export { getNewWindowIdentifier } from "@/utils/window/utils";
export { appendWindowToUrl } from "@/utils/url/utils";

// --- Server actions ---
export type { ExecuteProcessResult } from "@/app/actions/process";
export { revalidateDopoProcess } from "@/app/actions/revalidate";

// --- Utilities ---
export { buildPayloadByInputName, buildProcessPayload } from "@/utils";
export { executeStringFunction } from "@/utils/functions";
export { createProcessExpressionContext } from "./utils/processExpressionUtils";
export { logger } from "@/utils/logger";
export { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
export { convertToISODateFormat } from "@/utils/process/processDefaultsUtils";
export { mapKeysWithDefaults } from "@/utils/processes/manual/utils";
export {
  buildProcessScriptContext,
  applyGridSelection,
  updateParametersFromOnLoadResult,
} from "@/utils/processes/definition/utils";
export { evaluateParameterDefaults } from "@/utils/process/evaluateParameterDefaults";
export { buildProcessParameters } from "@/utils/process/processPayloadMapper";
export {
  isBulkCompletionProcess,
  DEFAULT_BULK_COMPLETION_ONLOAD,
} from "@/utils/process/bulkCompletionUtils";
export { registerPayScriptDSL } from "./callouts/genericPayScriptCallout";
export { createOBShim } from "@/utils/propertyStore";
export { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
export { parseSmartClientMessage } from "./Custom/shared/processModalUtils";

// --- Constants ---
export {
  BUTTON_LIST_REFERENCE_ID,
  PROCESS_DEFINITION_DATA,
  WINDOW_SPECIFIC_KEYS,
  PROCESS_TYPES,
  ADD_PAYMENT_ORDER_PROCESS_ID,
} from "@/utils/processes/definition/constants";

// --- Components ---
export { GenericWarehouseProcess } from "./Custom/GenericWarehouseProcess";
export { ToastContent } from "@/components/ToastContent";

// --- Types ---
export type {
  ProcessDefinitionModalContentProps,
  RecordValues,
  ProcessDefinitionModalProps,
} from "./types";
export type { Tab, ProcessParameter, EntityData, Field } from "@workspaceui/api-client/src/api/types";

// --- API clients ---
export { datasource } from "@workspaceui/api-client/src/api/datasource";
export { Metadata } from "@workspaceui/api-client/src/api/metadata";

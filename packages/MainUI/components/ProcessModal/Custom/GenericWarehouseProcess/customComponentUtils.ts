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

import type { ProcessDefinition } from "@workspaceui/api-client/src/api/types";

/** Truthy string value emitted by the metadata converter for a Yes/No flag. */
const FLAG_YES = "Y";

/**
 * Decides whether a process provides its own custom UI component (built from the
 * schema returned by its onLoad) instead of the standard parameter form. The
 * decision is declarative: it reads the `etmetaCustomComponent` flag from the
 * process definition, so the custom-component execution path is chosen without
 * speculatively running the onLoad script.
 *
 * The converter may emit the flag as a boolean or as the legacy "Y"/"N" string,
 * so both shapes are accepted.
 *
 * @param processDefinition - The process definition metadata
 * @returns True when the process renders a custom component
 */
export const usesCustomComponent = (processDefinition: ProcessDefinition): boolean => {
  const flag = processDefinition.etmetaCustomComponent;
  return flag === true || flag === FLAG_YES;
};

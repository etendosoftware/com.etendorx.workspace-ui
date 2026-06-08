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

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import {
  clearProcessStack,
  getProcessStack,
  type OpenProcessRequest,
  popProcess,
  subscribeProcessStack,
} from "@/utils/processes/definition/processStack";
import ProcessDefinitionModal from "./ProcessDefinitionModal";
import type { ProcessDefinitionButton } from "./types";

/** Classic process-menu action discriminator. */
const ACTION_PROCESS = "P";

/**
 * Builds the minimal button the modal needs; the full process metadata is
 * lazy-loaded by `ProcessDefinitionModal` from `meta/process/{id}`, so an empty
 * `parameters` map and null script bodies are enough to bootstrap it.
 */
function buildButtonStub(request: OpenProcessRequest): ProcessDefinitionButton {
  const title = request.windowTitle ?? "";
  return {
    id: request.processId,
    name: title,
    action: ACTION_PROCESS,
    enabled: true,
    visible: true,
    processId: request.processId,
    buttonText: title,
    processInfo: {
      loadFunction: "",
      searchKey: "",
      clientSideValidation: "",
      _entityName: "ADProcess",
      id: request.processId,
      name: title,
      javaClassName: "",
      parameters: [],
    },
    processDefinition: {
      id: request.processId,
      name: title,
      description: "",
      javaClassName: "",
      parameters: {},
      etmetaOnload: null,
      etmetaOnprocess: null,
      etmetaOnRefresh: null,
      etmetaPayscriptLogic: null,
    },
  } as unknown as ProcessDefinitionButton;
}

/**
 * Renders the nested-process modal stack requested by migrated scripts via
 * `view.openProcess`. Subscribes to the singleton stack and renders one
 * {@link ProcessDefinitionModal} per entry; MUI layers each modal on top of the
 * previous one. Closing an entry (X or success) pops it and fires the launcher's
 * refresh callback. Mounted once globally, under the app providers.
 */
export default function ProcessStackHost() {
  const stack = useSyncExternalStore(subscribeProcessStack, getProcessStack, getProcessStack);

  // Drop any pending entry when the host unmounts (app teardown).
  useEffect(() => () => clearProcessStack(), []);

  if (stack.length === 0) return null;

  const handleClose = (request: OpenProcessRequest) => {
    popProcess(request.id);
    request.onClose?.();
  };

  return (
    <>
      {stack.map((request) => (
        <ProcessDefinitionModal
          key={request.id}
          open
          type={PROCESS_TYPES.PROCESS_DEFINITION}
          button={buildButtonStub(request)}
          windowId={request.windowId}
          windowTitle={request.windowTitle}
          contextRecord={request.externalParams}
          callerField={request.callerField}
          onClose={() => handleClose(request)}
          onSuccess={() => handleClose(request)}
          data-testid="ProcessStackHost__ProcessDefinitionModal"
        />
      ))}
    </>
  );
}

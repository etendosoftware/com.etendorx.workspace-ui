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

import type { BaseFieldDefinition } from "@workspaceui/api-client/src/api/types";
import type { ProcessActionButton, ProcessButton, ProcessDefinitionButton } from "@/components/ProcessModal/types";
import type { TOOLBAR_BUTTONS_TYPES } from "@/utils/toolbar/constants";

export type ButtonType = keyof typeof TOOLBAR_BUTTONS_TYPES;
export type ButtonSection = "left" | "center" | "right";

export interface ToolbarButtonMetadata {
  id: string;
  action: string;
  name: string;
  icon?: string | null;
  active: boolean;
  seqno?: number | null;
  buttonType: ButtonType;
  section: ButtonSection;
  modalConfig?: {
    title?: string;
    size?: "small" | "medium" | "large";
  };
  dropdownConfig?: {
    items?: Array<{ label: string; action: string }>;
  };
}

export interface OrganizedSections {
  left: ToolbarButtonMetadata[];
  center: ToolbarButtonMetadata[];
  right: ToolbarButtonMetadata[];
}

export interface ExecuteProcessParams {
  button: ProcessButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export interface ExecuteProcessDefinitionParams {
  button: ProcessDefinitionButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export interface ExecuteProcessActionParams {
  button: ProcessActionButton;
  recordId: BaseFieldDefinition<string>;
  params?: Record<string, unknown>;
}

export interface ToolbarResponse {
  response: {
    data: Array<ToolbarButtonMetadata>;
  } & Record<string, string>;
  windowId: string;
  isNew: boolean;
}

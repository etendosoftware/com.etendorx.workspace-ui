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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Metadata } from "./metadata";

export const INSTANCE_PURPOSE_PATH = "meta/instance-purpose";

/** Purposes an Etendo instance can be configured with (same codes as Classic's InstancePurpose list). */
export type InstancePurposeValue = "P" | "D" | "T" | "E";

export interface InstancePurposeState {
  /** True when the configuration modal has to be shown to the current session. */
  required: boolean;
  /** The configured purpose, or null while the instance has none. */
  purpose: InstancePurposeValue | null;
  /** The accepted purposes, in display order. */
  options: InstancePurposeValue[];
}

/** Reads whether the instance purpose has to be configured by the current session, and its current value. */
export async function fetchInstancePurpose(): Promise<InstancePurposeState> {
  const response = await Metadata.client.request(INSTANCE_PURPOSE_PATH, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch the instance purpose: ${response.status}`);
  }
  return response.data as InstancePurposeState;
}

/** Stores the purpose of the instance. Only system-level roles are allowed to. */
export async function saveInstancePurpose(purpose: InstancePurposeValue): Promise<InstancePurposeState> {
  const response = await Metadata.client.request(INSTANCE_PURPOSE_PATH, {
    method: "POST",
    body: JSON.stringify({ purpose }),
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to save the instance purpose: ${response.status}`);
  }
  return response.data as InstancePurposeState;
}

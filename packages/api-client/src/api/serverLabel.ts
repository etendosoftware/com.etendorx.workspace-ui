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

/** Classic handler that answers the translated text of one message (`OB.I18N.getLabelFromServer`). */
export const GET_LABEL_ACTION = "org.openbravo.client.kernel.GetLabelActionHandler";

/**
 * Reads the translated text of an AD_Message that is not in the label catalog of the session, as classic
 * `OB.I18N.getLabelFromServer` does.
 *
 * @param key - Search key of the message
 * @returns The text, or `undefined` when the message does not exist
 */
export const fetchServerLabel = async (key: string): Promise<string | undefined> => {
  const params = new URLSearchParams({ _action: GET_LABEL_ACTION, key });
  const response = await Metadata.kernelClient.request(`?${params}`, { method: "GET" });

  if (!response.ok) {
    throw new Error(`Failed to fetch label ${key}: HTTP ${response.status}`);
  }

  return (response.data as { label?: string } | undefined)?.label;
};

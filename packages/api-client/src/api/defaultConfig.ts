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

import { Metadata } from "./metadata";
import type { DefaultConfiguration } from "./types";

const DEFAULT_CONFIG = {
  language: "192",
  role: "0",
  client: "0",
  organization: "0",
  warehouse: "0",
  default: "true",
};

export const setDefaultConfiguration = async (config: DefaultConfiguration): Promise<void> => {
  const client = Metadata.kernelClient;

  const params = {
    language: (config.language || DEFAULT_CONFIG.language).toString(),
    role: (config.defaultRole || DEFAULT_CONFIG.role).toString(),
    client: (config.client || DEFAULT_CONFIG.client).toString(),
    organization: (config.organization || DEFAULT_CONFIG.organization).toString(),
    warehouse: (config.defaultWarehouse || DEFAULT_CONFIG.warehouse).toString(),
    default: DEFAULT_CONFIG.default,
  };

  try {
    const response = await client.post(
      "?command=save&_action=org.openbravo.client.application.navigationbarcomponents.UserInfoWidgetActionHandler&stateless=true",
      params
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (typeof response.data === "string" && response.data.includes("throw")) {
      throw new Error("Server returned an error in JavaScript");
    }

    return response.data;
  } catch (error) {
    console.error("Error setting default configuration:", error);

    throw error;
  }
};

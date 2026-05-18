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

interface ChangePasswordPayload {
  currentPwd: string;
  newPwd: string;
  confirmPwd: string;
}

export const changePassword = async (params: ChangePasswordPayload): Promise<void> => {
  const client = Metadata.kernelClient;

  const response = await client.post(
    "?command=changePwd&_action=org.openbravo.client.application.navigationbarcomponents.UserInfoWidgetActionHandler&stateless=true",
    params as unknown as Record<string, unknown>
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (response.data?.result === "error") {
    const messageCode = response.data?.fields?.[0]?.messageCode ?? "passwordChangeError";
    throw new Error(messageCode);
  }
};

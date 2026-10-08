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

import { buildEtendoViewUrl } from "@/utils/url/utils";

/** Window name shared by the classic popups opened from the menu. */
export const CLASSIC_POPUP_NAME = "Test";

/** Size of the classic popups opened from the menu. */
export const CLASSIC_POPUP_FEATURES = "width=950,height=700";

/**
 * Opens a classic OB view (e.g. `OBUIAPP_AlertManagement`) in a popup, the way the menu opens its
 * `View` entries.
 *
 * @param baseUrl - Etendo Classic base URL
 * @param viewId - Classic view id
 * @param token - JWT used to authenticate the classic session
 */
export function openEtendoViewPopup({
  baseUrl,
  viewId,
  token,
}: {
  baseUrl: string;
  viewId: string;
  token: string | null;
}): void {
  const viewUrl = buildEtendoViewUrl({ baseUrl, viewId, token });
  window.open(viewUrl, CLASSIC_POPUP_NAME, CLASSIC_POPUP_FEATURES);
}

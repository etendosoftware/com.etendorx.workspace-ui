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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/**
 * Sandbox for trusted embedded pages: needed for embedded apps (auth popups, forms, downloads).
 * allow-top-navigation is intentionally excluded to prevent iframes from redirecting the parent
 * page (e.g. Google Calendar auth redirects).
 */
export const IFRAME_SANDBOX_PERMISSIVE = "allow-scripts allow-same-origin allow-popups allow-forms allow-downloads";

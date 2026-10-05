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

import type { WindowState } from "@/utils/window/constants";
import { IFRAME_SANDBOX_PERMISSIVE } from "@/utils/iframeSandbox";

/**
 * Content of an in-app tab opened from an External menu entry: the configured URL embedded in an
 * iframe that fills the tab (the counterpart of Classic's `OBExternalPage`).
 */
export default function ExternalPage({ window }: { window: WindowState }) {
  return (
    <iframe
      src={window.externalUrl}
      sandbox={IFRAME_SANDBOX_PERMISSIVE}
      referrerPolicy="no-referrer"
      className="w-full h-full border-0"
      title={window.title}
      data-testid={`ExternalPage__${window.windowIdentifier}`}
    />
  );
}

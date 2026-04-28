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

import type { UrlWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import { isSafeUrl } from "@/utils/urlSafety";

interface UrlRendererProps {
  data: UrlWidgetData;
}

// Permissions always granted: needed for embedded apps (auth popups, forms, downloads).
// allow-top-navigation is intentionally excluded to prevent iframes from
// redirecting the parent page (e.g. Google Calendar auth redirects).
const SANDBOX_PERMISSIVE = "allow-scripts allow-same-origin allow-popups allow-forms allow-downloads";
// Restricted mode: no popups, no forms — for untrusted content.
const SANDBOX_RESTRICTED = "allow-scripts allow-same-origin";

export default function UrlRenderer({ data }: UrlRendererProps) {
  if (!isSafeUrl(data.url)) {
    return (
      <p className="text-sm text-error-main" data-testid="UrlRenderer__blocked">
        URL not allowed
      </p>
    );
  }

  return (
    <iframe
      key={data.url}
      src={data.url}
      sandbox={data.sandbox ? SANDBOX_RESTRICTED : SANDBOX_PERMISSIVE}
      referrerPolicy="no-referrer"
      className="w-full h-full rounded-lg border-0"
      title="widget-url-content"
      data-testid="UrlRenderer__iframe"
    />
  );
}

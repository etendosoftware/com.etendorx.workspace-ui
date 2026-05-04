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

import type { ProcessWidgetData } from "@workspaceui/api-client/src/api/dashboard";

interface ProcessRendererProps {
  data: ProcessWidgetData;
}

export default function ProcessRenderer({ data }: ProcessRendererProps) {
  const isError = data.status === "error";

  return (
    <div className="flex flex-col gap-3" data-testid="ProcessRenderer__content">
      <p className="text-sm text-baseline-50">{data.message}</p>
      {data.result?.name && (
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${isError ? "bg-error-main" : "bg-success-main"}`}
            data-testid="ProcessRenderer__status_dot"
          />
          <span className="text-sm font-medium text-baseline-100" data-testid="ProcessRenderer__name">
            {data.result.name}
          </span>
        </div>
      )}
    </div>
  );
}

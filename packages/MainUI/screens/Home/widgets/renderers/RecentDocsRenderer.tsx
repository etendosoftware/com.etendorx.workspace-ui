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

import type { RecentDocsWidgetData } from "@workspaceui/api-client/src/api/dashboard";

interface RecentDocsRendererProps {
  data: RecentDocsWidgetData;
}

export default function RecentDocsRenderer({ data }: RecentDocsRendererProps) {
  if (data.items.length === 0) {
    return (
      <p className="text-sm text-baseline-50" data-testid="RecentDocsRenderer__empty">
        —
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-testid="RecentDocsRenderer__list">
      {data.items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable composite key available
        <li
          key={i}
          className="flex items-center justify-between gap-2"
          data-testid={`RecentDocsRenderer__item_${i}`}>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-baseline-100 truncate">{item.label}</span>
            <span className="text-xs text-baseline-50">{item.type}</span>
          </div>
          <span className="text-xs text-baseline-50 shrink-0">{item.time}</span>
        </li>
      ))}
    </ul>
  );
}

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

import type { QueryListWidgetData } from "@workspaceui/api-client/src/api/dashboard";

interface QueryListRendererProps {
  data: QueryListWidgetData;
}

export default function QueryListRenderer({ data }: QueryListRendererProps) {
  if (data.rows.length === 0) {
    return (
      <p className="text-sm text-baseline-50" data-testid="QueryListRenderer__empty">
        —
      </p>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="QueryListRenderer__content">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {data.columns.map((col) => (
              <th
                key={col.name}
                className="text-left text-xs font-semibold text-baseline-50 pb-2 pr-4"
                data-testid={`QueryListRenderer__th_${col.name}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id
            <tr key={i} className="border-t border-transparent-neutral-10">
              {data.columns.map((col) => (
                <td
                  key={col.name}
                  className="py-1.5 pr-4 text-baseline-100"
                  data-testid={`QueryListRenderer__cell_${i}_${col.name}`}>
                  {String(row[col.name] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

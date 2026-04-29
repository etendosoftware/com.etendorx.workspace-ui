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

"use client";

import { useState, useTransition } from "react";
import type { QueryListWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import { WIDGET_PAGE_SIZE } from "@/hooks/useDashboard";

interface QueryListRendererProps {
  data: QueryListWidgetData;
  onFetchPage: (page: number, pageSize: number) => Promise<void>;
}

function inferColumns(data: QueryListWidgetData): { name: string; label: string }[] {
  if (data.columns.length > 0) {
    return data.columns;
  }
  if (data.rows.length === 0) return [];
  return Object.keys(data.rows[0]).map((key) => ({
    name: key,
    label: key.replace(/^col(\d+)$/, (_, n) => `Col ${Number(n) + 1}`),
  }));
}

export default function QueryListRenderer({ data, onFetchPage }: QueryListRendererProps) {
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const totalPages = data.totalRows > 0 ? Math.ceil(data.totalRows / WIDGET_PAGE_SIZE) : 1;

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || isPending) return;
    setPage(next);
    startTransition(() => {
      onFetchPage(next, WIDGET_PAGE_SIZE);
    });
  };

  if (data.rows.length === 0 && page === 1) {
    return (
      <p className="text-sm text-baseline-50" data-testid="QueryListRenderer__empty">
        —
      </p>
    );
  }

  const columns = inferColumns(data);

  return (
    <div className="flex flex-col gap-2" data-testid="QueryListRenderer__content">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="text-left text-xs font-semibold text-baseline-50 pb-2 pr-4 whitespace-nowrap"
                  data-testid={`QueryListRenderer__th_${col.name}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isPending ? "opacity-50" : ""}>
            {data.rows.map((row, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id
              <tr key={i} className="border-t border-transparent-neutral-10">
                {columns.map((col) => (
                  <td
                    key={col.name}
                    className="py-1.5 pr-4 text-baseline-100 whitespace-nowrap"
                    data-testid={`QueryListRenderer__cell_${i}_${col.name}`}>
                    {String(row[col.name] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between pt-1 border-t border-transparent-neutral-10"
          data-testid="QueryListRenderer__pagination">
          <span className="text-xs text-baseline-50">
            {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isPending}
              className="px-2 py-1 text-xs rounded text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              data-testid="QueryListRenderer__prev">
              ←
            </button>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isPending}
              className="px-2 py-1 text-xs rounded text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              data-testid="QueryListRenderer__next">
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

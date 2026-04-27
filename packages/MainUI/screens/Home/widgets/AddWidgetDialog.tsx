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

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WidgetClass, WidgetType } from "@workspaceui/api-client/src/api/dashboard";
import { useTranslation } from "@/hooks/useTranslation";

// ── Icons ─────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const WIDGET_TYPE_ICONS: Record<WidgetType, React.ReactElement> = {
  FAVORITES: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  RECENT_DOCS: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  RECENTLY_VIEWED: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  NOTIFICATION: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  STOCK_ALERT: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  KPI: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  COPILOT: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L9.5 8.5 3 9.27l5 4.87-1.18 6.88L12 17.77l5.18 3.25L16 14.14l5-4.87-6.5-.77L12 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  QUERY_LIST: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  HTML: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m16 18 6-6-6-6M8 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  URL: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  PROCESS: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const TYPE_COLOR: Record<WidgetType, string> = {
  FAVORITES: "bg-yellow-500/15 text-yellow-600",
  RECENT_DOCS: "bg-blue-500/15 text-blue-600",
  RECENTLY_VIEWED: "bg-indigo-500/15 text-indigo-600",
  NOTIFICATION: "bg-orange-500/15 text-orange-600",
  STOCK_ALERT: "bg-red-500/15 text-red-600",
  KPI: "bg-green-500/15 text-green-600",
  COPILOT: "bg-purple-500/15 text-purple-600",
  QUERY_LIST: "bg-cyan-500/15 text-cyan-600",
  HTML: "bg-zinc-500/15 text-zinc-600",
  URL: "bg-teal-500/15 text-teal-600",
  PROCESS: "bg-slate-500/15 text-slate-600",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddWidgetDialogProps {
  open: boolean;
  widgetClasses: WidgetClass[];
  isLoadingClasses: boolean;
  classesError: string | null;
  isAdding: boolean;
  addedWidgetClassIds?: Set<string>;
  onClose: () => void;
  onAdd: (widgetClass: WidgetClass) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddWidgetDialog({
  open,
  widgetClasses,
  isLoadingClasses,
  classesError,
  isAdding,
  addedWidgetClassIds,
  onClose,
  onAdd,
}: AddWidgetDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WidgetClass | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDialogElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(null);
      // Focus search on open (after paint)
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // Trap focus inside panel
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    },
    [onClose]
  );

  const filtered = widgetClasses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.description?.toLowerCase().includes(search.toLowerCase()) ||
      w.type.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
      data-testid="AddWidgetDialog__backdrop">
      {/* Panel */}
      <dialog
        ref={panelRef}
        open
        aria-label={t("dashboard.addWidget.title")}
        className="relative flex flex-col w-full max-w-2xl max-h-[80vh] rounded-2xl bg-baseline-0 shadow-2xl overflow-hidden m-0 p-0 border-0"
        data-testid="AddWidgetDialog__panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-transparent-neutral-10 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-baseline-100" data-testid="AddWidgetDialog__title">
              {t("dashboard.addWidget.title")}
            </h2>
            <p className="text-xs text-baseline-50">{t("dashboard.addWidget.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dashboard.addWidget.close")}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer"
            data-testid="AddWidgetDialog__close">
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-baseline-50 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("dashboard.addWidget.search")}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-transparent-neutral-5 border border-transparent-neutral-10 text-baseline-100 placeholder:text-baseline-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors"
              data-testid="AddWidgetDialog__search"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4" data-testid="AddWidgetDialog__content">
          {/* Loading */}
          {isLoadingClasses && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="AddWidgetDialog__skeleton">
              {Array.from({ length: 6 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton, no stable key available
                <div key={i} className="rounded-xl bg-transparent-neutral-5 p-4 h-24 animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {classesError && !isLoadingClasses && (
            <div
              role="alert"
              className="rounded-xl bg-error-contrast-text border border-error-main/20 p-4 text-sm text-error-main"
              data-testid="AddWidgetDialog__error">
              {t("dashboard.addWidget.loadError")}
            </div>
          )}

          {/* Empty state */}
          {!isLoadingClasses && !classesError && filtered.length === 0 && (
            <p className="text-sm text-baseline-50 py-8 text-center" data-testid="AddWidgetDialog__empty">
              {t("dashboard.addWidget.noResults")}
            </p>
          )}

          {/* Widget grid */}
          {!isLoadingClasses && !classesError && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="AddWidgetDialog__grid">
              {filtered.map((wc) => {
                const isSelected = selected?.widgetClassId === wc.widgetClassId;
                const isAlreadyAdded = addedWidgetClassIds?.has(wc.widgetClassId) ?? false;
                return (
                  <button
                    key={wc.widgetClassId}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => !isAlreadyAdded && setSelected(isSelected ? null : wc)}
                    className={[
                      "flex items-start gap-3 rounded-xl p-4 text-left border transition-all duration-150 group",
                      isAlreadyAdded
                        ? "opacity-50 cursor-not-allowed bg-transparent-neutral-5 border-transparent-neutral-10"
                        : isSelected
                          ? "cursor-pointer bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30"
                          : "cursor-pointer bg-transparent-neutral-5 border-transparent-neutral-10 hover:bg-transparent-neutral-10 hover:border-transparent-neutral-20",
                    ].join(" ")}
                    data-testid={`AddWidgetDialog__card_${wc.widgetClassId}`}>
                    {/* Icon */}
                    <div
                      className={[
                        "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                        TYPE_COLOR[wc.type] ?? "bg-baseline-10 text-baseline-50",
                      ].join(" ")}>
                      {WIDGET_TYPE_ICONS[wc.type] ?? WIDGET_TYPE_ICONS.PROCESS}
                    </div>
                    {/* Text */}
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-sm font-medium text-baseline-100 leading-snug truncate">
                        {wc.title || wc.name}
                      </span>
                      {wc.description && (
                        <span className="text-xs text-baseline-50 leading-snug line-clamp-2">{wc.description}</span>
                      )}
                      <span
                        className={[
                          "mt-1 inline-block self-start text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          TYPE_COLOR[wc.type] ?? "bg-baseline-10 text-baseline-50",
                        ].join(" ")}>
                        {wc.type.replace("_", " ")}
                      </span>
                    </div>
                    {/* Already added badge */}
                    {isAlreadyAdded && (
                      <div
                        className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-transparent-neutral-10 text-baseline-50 whitespace-nowrap"
                        aria-label={t("dashboard.addWidget.alreadyAdded")}>
                        {t("dashboard.addWidget.alreadyAdded")}
                      </div>
                    )}
                    {/* Checkmark */}
                    {!isAlreadyAdded && isSelected && (
                      <div
                        className="shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                        aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M20 6 9 17l-5-5"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-transparent-neutral-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer"
            data-testid="AddWidgetDialog__cancel">
            {t("dashboard.addWidget.cancel")}
          </button>
          <button
            type="button"
            disabled={!selected || isAdding}
            onClick={() => selected && onAdd(selected)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            data-testid="AddWidgetDialog__add">
            {isAdding ? <SpinnerIcon /> : <PlusIcon />}
            {isAdding ? t("dashboard.addWidget.adding") : t("dashboard.addWidget.add")}
          </button>
        </div>
      </dialog>
    </div>
  );
}

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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WidgetClass, WidgetType } from "@workspaceui/api-client/src/api/dashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { isSafeUrl, isUrlParam } from "@/utils/urlSafety";

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
  CALENDAR: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  CALENDAR: "bg-blue-500/15 text-blue-600",
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddWidgetDialogProps {
  open: boolean;
  widgetClasses: WidgetClass[];
  isLoadingClasses: boolean;
  classesError: string | null;
  isAdding: boolean;
  addedWidgetClassIds?: Set<string>;
  submitError?: string | null;
  onClose: () => void;
  onAdd: (widgetClass: WidgetClass, parameters: Record<string, string>) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddWidgetDialog({
  open,
  widgetClasses,
  isLoadingClasses,
  classesError,
  isAdding,
  addedWidgetClassIds,
  submitError,
  onClose,
  onAdd,
}: AddWidgetDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WidgetClass | null>(null);
  const [step, setStep] = useState<"select" | "configure">("select");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDialogElement>(null);

  const configurableParams = useMemo(() => selected?.params.filter((p) => !p.fixed) ?? [], [selected]);
  const hasConfigurableParams = configurableParams.length > 0;

  const urlErrors = useMemo<Record<string, boolean>>(() => {
    const errors: Record<string, boolean> = {};
    for (const p of configurableParams) {
      const val = paramValues[p.name] ?? "";
      if (p.type === "TEXT" && isUrlParam(p) && val !== "" && !isSafeUrl(val)) {
        errors[p.name] = true;
      }
    }
    return errors;
  }, [configurableParams, paramValues]);

  const hasUrlErrors = Object.keys(urlErrors).length > 0;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(null);
      setStep("select");
      setParamValues({});
      // Focus search on open (after paint)
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  function handlePrimaryClick() {
    if (!selected) return;
    if (step === "select" && hasConfigurableParams) {
      const defaults: Record<string, string> = {};
      for (const p of configurableParams) {
        defaults[p.name] = p.defaultValue ?? "";
      }
      setParamValues(defaults);
      setStep("configure");
    } else {
      onAdd(selected, paramValues);
    }
  }

  function handleBack() {
    setStep("select");
  }

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
              {step === "configure" && selected ? selected.title || selected.name : t("dashboard.addWidget.title")}
            </h2>
            <p className="text-xs text-baseline-50">
              {step === "configure" ? t("dashboard.addWidget.configureSubtitle") : t("dashboard.addWidget.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dashboard.addWidget.close")}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer"
            data-testid="AddWidgetDialog__close">
            <CloseIcon data-testid="CloseIcon__18a9ac" />
          </button>
        </div>

        {/* Search — only in select step */}
        {step === "select" && (
          <div className="px-6 py-3 shrink-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-baseline-50 pointer-events-none">
                <SearchIcon data-testid="SearchIcon__18a9ac" />
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
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4" data-testid="AddWidgetDialog__content">
          {/* Configure params step */}
          {step === "configure" && selected && (
            <div className="flex flex-col gap-4" data-testid="AddWidgetDialog__configure">
              {selected.description && (
                <p className="text-xs text-baseline-50 leading-relaxed" data-testid="AddWidgetDialog__configure_desc">
                  {selected.description}
                </p>
              )}
              {configurableParams.map((param) => (
                <div key={param.name} className="flex flex-col gap-1.5">
                  <label htmlFor={`param-${param.name}`} className="text-sm font-medium text-baseline-100">
                    {param.displayName}
                    {param.required && <span className="text-error-main ml-0.5">*</span>}
                  </label>
                  {(() => {
                    if (param.type === "BOOLEAN") {
                      return (
                        <input
                          id={`param-${param.name}`}
                          type="checkbox"
                          checked={paramValues[param.name] === "true"}
                          onChange={(e) =>
                            setParamValues((prev) => ({
                              ...prev,
                              [param.name]: e.target.checked ? "true" : "false",
                            }))
                          }
                          className="w-4 h-4 cursor-pointer"
                          data-testid={`AddWidgetDialog__param_${param.name}`}
                        />
                      );
                    }
                    if (param.type === "LIST" && param.listValues) {
                      return (
                        <select
                          id={`param-${param.name}`}
                          value={paramValues[param.name] ?? ""}
                          onChange={(e) => setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-transparent-neutral-5 border border-transparent-neutral-10 text-baseline-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          data-testid={`AddWidgetDialog__param_${param.name}`}>
                          {param.listValues.map((lv) => (
                            <option key={lv.value} value={lv.value}>
                              {lv.label}
                            </option>
                          ))}
                        </select>
                      );
                    }
                    return (
                      <input
                        id={`param-${param.name}`}
                        type={param.type === "NUMBER" ? "number" : "text"}
                        value={paramValues[param.name] ?? ""}
                        onChange={(e) => setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))}
                        className={[
                          "w-full px-3 py-2 text-sm rounded-lg bg-transparent-neutral-5 border text-baseline-100 placeholder:text-baseline-50 focus:outline-none focus:ring-2 transition-colors",
                          urlErrors[param.name]
                            ? "border-error-main focus:ring-error-main/40"
                            : "border-transparent-neutral-10 focus:ring-blue-500/40",
                        ].join(" ")}
                        data-testid={`AddWidgetDialog__param_${param.name}`}
                      />
                    );
                  })()}
                  {urlErrors[param.name] && (
                    <p className="text-xs text-error-main" data-testid={`AddWidgetDialog__param_error_${param.name}`}>
                      {t("dashboard.params.urlError")}
                    </p>
                  )}
                  {param.description && (
                    <p
                      className="text-xs text-baseline-50 leading-snug"
                      data-testid={`AddWidgetDialog__param_hint_${param.name}`}>
                      {param.description}
                    </p>
                  )}
                </div>
              ))}
              {submitError && (
                <p className="text-sm text-error-main mt-2" data-testid="AddWidgetDialog__submit_error">
                  {t("dashboard.addWidget.submitError")}
                </p>
              )}
            </div>
          )}
          {/* Select widget step */}
          {step === "select" && (
            <>
              {/* Loading */}
              {isLoadingClasses && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="AddWidgetDialog__skeleton">
                  {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((id) => (
                    <div key={id} className="rounded-xl bg-transparent-neutral-5 p-4 h-24 animate-pulse" />
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
                    const isUnavailable = wc.available === false;
                    const isDisabled = isAlreadyAdded || isUnavailable;
                    return (
                      <button
                        key={wc.widgetClassId}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setSelected(isSelected ? null : wc)}
                        className={[
                          "flex items-start gap-3 rounded-xl p-4 text-left border transition-all duration-150 group",
                          (() => {
                            if (isDisabled)
                              return "opacity-50 cursor-not-allowed bg-transparent-neutral-5 border-transparent-neutral-10";
                            if (isSelected)
                              return "cursor-pointer bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30";
                            return "cursor-pointer bg-transparent-neutral-5 border-transparent-neutral-10 hover:bg-transparent-neutral-10 hover:border-transparent-neutral-20";
                          })(),
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
                        {isAlreadyAdded && !isUnavailable && (
                          <div
                            className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-transparent-neutral-10 text-baseline-50 whitespace-nowrap"
                            aria-label={t("dashboard.addWidget.alreadyAdded")}>
                            {t("dashboard.addWidget.alreadyAdded")}
                          </div>
                        )}
                        {/* Unavailable badge */}
                        {isUnavailable && (
                          <div
                            className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-transparent-neutral-10 text-baseline-50 whitespace-nowrap"
                            aria-label={t("dashboard.addWidget.unavailable")}>
                            {t("dashboard.addWidget.unavailable")}
                          </div>
                        )}
                        {/* Checkmark */}
                        {!isDisabled && isSelected && (
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-transparent-neutral-10 shrink-0">
          {step === "configure" ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-lg text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer"
              data-testid="AddWidgetDialog__back">
              {t("dashboard.addWidget.back")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer"
              data-testid="AddWidgetDialog__cancel">
              {t("dashboard.addWidget.cancel")}
            </button>
          )}
          <button
            type="button"
            disabled={!selected || isAdding || (step === "configure" && hasUrlErrors)}
            onClick={handlePrimaryClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            data-testid="AddWidgetDialog__add">
            {isAdding ? <SpinnerIcon data-testid="SpinnerIcon__18a9ac" /> : <PlusIcon data-testid="PlusIcon__18a9ac" />}
            {(() => {
              if (isAdding) return t("dashboard.addWidget.adding");
              if (step === "select" && hasConfigurableParams) return t("dashboard.addWidget.next");
              return t("dashboard.addWidget.add");
            })()}
          </button>
        </div>
      </dialog>
    </div>
  );
}

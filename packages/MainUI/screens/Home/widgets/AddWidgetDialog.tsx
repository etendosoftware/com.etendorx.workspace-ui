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
import type { WidgetClass } from "@workspaceui/api-client/src/api/dashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { CloseIcon, SpinnerIcon } from "./icons";
import WidgetParamFields, { useUrlErrors } from "./WidgetParamFields";
import { WIDGET_TYPE_COLOR, WIDGET_TYPE_ICONS } from "./widgetTypeVisuals";

// ── Icons (local to this dialog) ─────────────────────────────────────────────

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

/** "Added" / "Unavailable" badges of a widget card. */
const STATUS_BADGE_CLASSES =
  "shrink-0 text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-transparent-neutral-10 text-baseline-70 whitespace-nowrap";
/** Cancel / Back buttons of the dialog footer. */
const SECONDARY_ACTION_CLASSES =
  "px-4 py-2 text-sm font-medium rounded-lg text-baseline-70 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer";

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

  const { hasUrlErrors } = useUrlErrors(configurableParams, paramValues);

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
            <p className="text-xs text-baseline-70">
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
                <p className="text-xs text-baseline-70 leading-relaxed" data-testid="AddWidgetDialog__configure_desc">
                  {selected.description}
                </p>
              )}
              <WidgetParamFields
                params={configurableParams}
                values={paramValues}
                onChange={setParamValues}
                testIdPrefix="AddWidgetDialog"
                data-testid="WidgetParamFields__18a9ac"
              />
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
                <p className="text-sm text-baseline-70 py-8 text-center" data-testid="AddWidgetDialog__empty">
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
                            WIDGET_TYPE_COLOR[wc.type] ?? "bg-baseline-10 text-baseline-50",
                          ].join(" ")}>
                          {WIDGET_TYPE_ICONS[wc.type] ?? WIDGET_TYPE_ICONS.PROCESS}
                        </div>
                        {/* Text */}
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="text-sm font-medium text-baseline-100 leading-snug truncate">
                            {wc.title || wc.name}
                          </span>
                          {wc.description && (
                            <span className="text-xs text-baseline-70 leading-snug line-clamp-2">{wc.description}</span>
                          )}
                          <span
                            className={[
                              "mt-1 inline-block self-start text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                              WIDGET_TYPE_COLOR[wc.type] ?? "bg-baseline-10 text-baseline-50",
                            ].join(" ")}>
                            {wc.type.replace("_", " ")}
                          </span>
                        </div>
                        {/* Already added badge */}
                        {isAlreadyAdded && !isUnavailable && (
                          <div className={STATUS_BADGE_CLASSES} aria-label={t("dashboard.addWidget.alreadyAdded")}>
                            {t("dashboard.addWidget.alreadyAdded")}
                          </div>
                        )}
                        {/* Unavailable badge */}
                        {isUnavailable && (
                          <div className={STATUS_BADGE_CLASSES} aria-label={t("dashboard.addWidget.unavailable")}>
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
              className={SECONDARY_ACTION_CLASSES}
              data-testid="AddWidgetDialog__back">
              {t("dashboard.addWidget.back")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={SECONDARY_ACTION_CLASSES}
              data-testid="AddWidgetDialog__cancel">
              {t("dashboard.addWidget.cancel")}
            </button>
          )}
          <button
            type="button"
            disabled={!selected || isAdding || (step === "configure" && hasUrlErrors)}
            onClick={handlePrimaryClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-(--ui-accent) hover:bg-(--ui-accent-hover) disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
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

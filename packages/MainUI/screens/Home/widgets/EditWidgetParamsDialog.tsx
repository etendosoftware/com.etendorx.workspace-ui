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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WidgetClass, WidgetInstance } from "@workspaceui/api-client/src/api/dashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { isSafeUrl, isUrlParam } from "@/utils/urlSafety";

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface EditWidgetParamsDialogProps {
  open: boolean;
  instance: WidgetInstance | null;
  widgetClass: WidgetClass | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (instanceId: string, parameters: Record<string, string>) => void;
}

export default function EditWidgetParamsDialog({
  open,
  instance,
  widgetClass,
  isSaving,
  onClose,
  onSave,
}: EditWidgetParamsDialogProps) {
  const { t } = useTranslation();
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const panelRef = useRef<HTMLDialogElement>(null);

  const configurableParams = widgetClass?.params.filter((p) => !p.fixed) ?? [];

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

  // Initialize param values from current instance params + class defaults
  useEffect(() => {
    if (open && instance && widgetClass) {
      const initial: Record<string, string> = {};
      for (const p of configurableParams) {
        initial[p.name] = instance.parameters[p.name] ?? p.defaultValue ?? "";
      }
      setParamValues(initial);
    }
  }, [open, instance, widgetClass]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    },
    [onClose]
  );

  if (!open || !instance || !widgetClass) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="presentation"
      data-testid="EditWidgetParamsDialog__backdrop">
      <dialog
        ref={panelRef}
        open
        aria-label={widgetClass.title || widgetClass.name}
        className="relative flex flex-col w-full max-w-lg rounded-2xl bg-baseline-0 shadow-2xl overflow-hidden m-0 p-0 border-0"
        data-testid="EditWidgetParamsDialog__panel">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-transparent-neutral-10 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-baseline-100" data-testid="EditWidgetParamsDialog__title">
              {widgetClass.title || widgetClass.name}
            </h2>
            <p className="text-xs text-baseline-50">{t("dashboard.addWidget.configureSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("dashboard.addWidget.close")}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer"
            data-testid="EditWidgetParamsDialog__close">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-6 py-5" data-testid="EditWidgetParamsDialog__content">
          {widgetClass.description && (
            <p className="text-xs text-baseline-50 leading-relaxed">{widgetClass.description}</p>
          )}
          {configurableParams.map((param) => (
            <div key={param.name} className="flex flex-col gap-1.5">
              <label htmlFor={`edit-param-${param.name}`} className="text-sm font-medium text-baseline-100">
                {param.displayName}
                {param.required && <span className="text-error-main ml-0.5">*</span>}
              </label>
              {param.type === "BOOLEAN" ? (
                <input
                  id={`edit-param-${param.name}`}
                  type="checkbox"
                  checked={paramValues[param.name] === "true"}
                  onChange={(e) =>
                    setParamValues((prev) => ({ ...prev, [param.name]: e.target.checked ? "true" : "false" }))
                  }
                  className="w-4 h-4 cursor-pointer"
                  data-testid={`EditWidgetParamsDialog__param_${param.name}`}
                />
              ) : param.type === "LIST" && param.listValues ? (
                <select
                  id={`edit-param-${param.name}`}
                  value={paramValues[param.name] ?? ""}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-transparent-neutral-5 border border-transparent-neutral-10 text-baseline-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  data-testid={`EditWidgetParamsDialog__param_${param.name}`}>
                  {param.listValues.map((lv) => (
                    <option key={lv.value} value={lv.value}>
                      {lv.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`edit-param-${param.name}`}
                  type={param.type === "NUMBER" ? "number" : "text"}
                  value={paramValues[param.name] ?? ""}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))}
                  className={[
                    "w-full px-3 py-2 text-sm rounded-lg bg-transparent-neutral-5 border text-baseline-100 placeholder:text-baseline-50 focus:outline-none focus:ring-2 transition-colors",
                    urlErrors[param.name]
                      ? "border-error-main focus:ring-error-main/40"
                      : "border-transparent-neutral-10 focus:ring-blue-500/40",
                  ].join(" ")}
                  data-testid={`EditWidgetParamsDialog__param_${param.name}`}
                />
              )}
              {urlErrors[param.name] && (
                <p className="text-xs text-error-main" data-testid={`EditWidgetParamsDialog__param_error_${param.name}`}>
                  {t("dashboard.params.urlError")}
                </p>
              )}
              {param.description && (
                <p className="text-xs text-baseline-50 leading-snug" data-testid={`EditWidgetParamsDialog__param_hint_${param.name}`}>
                  {param.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-transparent-neutral-10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10 transition-colors cursor-pointer"
            data-testid="EditWidgetParamsDialog__cancel">
            {t("dashboard.addWidget.cancel")}
          </button>
          <button
            type="button"
            disabled={isSaving || hasUrlErrors}
            onClick={() => onSave(instance.instanceId, paramValues)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
            data-testid="EditWidgetParamsDialog__save">
            {isSaving ? <SpinnerIcon /> : <SaveIcon />}
            {isSaving ? t("dashboard.editParams.saving") : t("dashboard.editParams.save")}
          </button>
        </div>
      </dialog>
    </div>
  );
}

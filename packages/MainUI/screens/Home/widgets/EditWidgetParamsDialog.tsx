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

import { useCallback, useEffect, useRef, useState } from "react";
import type { WidgetClass, WidgetInstance } from "@workspaceui/api-client/src/api/dashboard";
import { useTranslation } from "@/hooks/useTranslation";
import { CloseIcon, SaveIcon, SpinnerIcon } from "./icons";
import WidgetParamFields, { useUrlErrors } from "./WidgetParamFields";

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
  const { hasUrlErrors } = useUrlErrors(configurableParams, paramValues);

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
            <CloseIcon data-testid="CloseIcon__c6f8aa" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-6 py-5" data-testid="EditWidgetParamsDialog__content">
          {widgetClass.description && (
            <p className="text-xs text-baseline-50 leading-relaxed">{widgetClass.description}</p>
          )}
          <WidgetParamFields
            params={configurableParams}
            values={paramValues}
            onChange={setParamValues}
            testIdPrefix="EditWidgetParamsDialog"
            data-testid="WidgetParamFields__c6f8aa"
          />
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
            {isSaving ? <SpinnerIcon data-testid="SpinnerIcon__c6f8aa" /> : <SaveIcon data-testid="SaveIcon__c6f8aa" />}
            {isSaving ? t("dashboard.editParams.saving") : t("dashboard.editParams.save")}
          </button>
        </div>
      </dialog>
    </div>
  );
}

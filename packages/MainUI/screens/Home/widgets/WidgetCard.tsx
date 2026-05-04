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

import type { WidgetInstance, WidgetDataResponse, WidgetType } from "@workspaceui/api-client/src/api/dashboard";
import { useTranslation } from "@/hooks/useTranslation";
import WidgetRenderer from "./WidgetRenderer";

interface WidgetTheme {
  card: string;
  title: string;
  icon: string;
  iconHover: string;
  skeleton: string;
}

const DEFAULT_THEME: WidgetTheme = {
  card: "bg-baseline-10",
  title: "text-baseline-100",
  icon: "text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10",
  iconHover: "text-baseline-50",
  skeleton: "bg-transparent-neutral-10",
};

const WIDGET_THEMES: Partial<Record<WidgetType, WidgetTheme>> = {
  RECENT_DOCS: {
    card: "bg-secondary-100",
    title: "text-baseline-100",
    icon: "text-baseline-50 hover:text-baseline-100 hover:bg-transparent-neutral-10",
    iconHover: "text-baseline-50",
    skeleton: "bg-transparent-neutral-20",
  },
  FAVORITES: {
    card: "bg-[#0A0F1E]",
    title: "text-white",
    icon: "text-white/50 hover:text-white hover:bg-white/10",
    iconHover: "text-white/50",
    skeleton: "bg-white/10",
  },
};

function getTheme(type: WidgetType): WidgetTheme {
  return WIDGET_THEMES[type] ?? DEFAULT_THEME;
}

const DragIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="9" cy="6" r="1.5" fill="currentColor" />
    <circle cx="15" cy="6" r="1.5" fill="currentColor" />
    <circle cx="9" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15" cy="12" r="1.5" fill="currentColor" />
    <circle cx="9" cy="18" r="1.5" fill="currentColor" />
    <circle cx="15" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

interface WidgetCardProps {
  instance: WidgetInstance;
  data: WidgetDataResponse | undefined;
  error: string | undefined;
  hasConfigurableParams?: boolean;
  onRemove: (instanceId: string) => void;
  onEditParams?: (instanceId: string) => void;
  onFetchPage: (page: number, pageSize: number) => Promise<void>;
}

export default function WidgetCard({
  instance,
  data,
  error,
  hasConfigurableParams,
  onRemove,
  onEditParams,
  onFetchPage,
}: WidgetCardProps) {
  const { t } = useTranslation();
  const isLocked = instance.layer !== "USER";
  const isUnavailable = instance.available === false || data?.available === false;
  const isLoading = data === undefined && error === undefined && !isUnavailable;
  const theme = getTheme(instance.type);

  return (
    <div
      className={`flex flex-col rounded-2xl ${theme.card} p-5 h-full min-h-40 overflow-hidden`}
      data-testid={`WidgetCard__${instance.instanceId}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 shrink-0 mb-3">
        {/* Drag handle — only this area initiates drag */}
        <span
          className="widget-drag-handle flex items-center gap-2 flex-1 min-w-0 cursor-grab active:cursor-grabbing select-none"
          title="Arrastrar widget"
          data-testid={`WidgetCard__drag_${instance.instanceId}`}>
          <span className={`shrink-0 ${theme.iconHover} opacity-50 hover:opacity-100 transition-opacity`}>
            <DragIcon data-testid="DragIcon__cb8729" />
          </span>
          <span className={`text-sm font-semibold ${theme.title} truncate`}>{instance.title}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {hasConfigurableParams && onEditParams && (
            <button
              type="button"
              onClick={() => onEditParams(instance.instanceId)}
              className={`${theme.icon} transition-colors cursor-pointer rounded p-0.5`}
              title="Configure widget"
              data-testid={`WidgetCard__settings_${instance.instanceId}`}>
              <SettingsIcon data-testid="SettingsIcon__cb8729" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(instance.instanceId)}
            className={`${theme.icon} transition-colors cursor-pointer rounded p-0.5`}
            title={isLocked ? "Ocultar widget" : "Eliminar widget"}
            data-testid={`WidgetCard__remove_${instance.instanceId}`}>
            <CloseIcon data-testid="CloseIcon__cb8729" />
          </button>
        </div>
      </div>
      {/* Content — scrollable area that fills remaining card height */}
      <div className="flex-1 min-h-0 overflow-y-auto" data-testid={`WidgetCard__body_${instance.instanceId}`}>
        {isUnavailable && (
          <p className="text-sm text-baseline-50 italic" data-testid={`WidgetCard__unavailable_${instance.instanceId}`}>
            {t("dashboard.widget.unavailable")}
          </p>
        )}
        {!isUnavailable && isLoading && (
          <div className="flex flex-col gap-2 animate-pulse" data-testid={`WidgetCard__loading_${instance.instanceId}`}>
            <div className={`h-3 rounded ${theme.skeleton} w-3/4`} />
            <div className={`h-3 rounded ${theme.skeleton} w-1/2`} />
            <div className={`h-3 rounded ${theme.skeleton} w-2/3`} />
          </div>
        )}
        {!isUnavailable && error !== undefined && !isLoading && (
          <p className="text-sm text-error-main" data-testid={`WidgetCard__error_${instance.instanceId}`}>
            {error}
          </p>
        )}
        {!isUnavailable && data !== undefined && !error && data.data !== null && (
          <WidgetRenderer
            type={instance.type}
            data={data.data}
            onFetchPage={onFetchPage}
            data-testid="WidgetRenderer__cb8729"
          />
        )}
      </div>
    </div>
  );
}

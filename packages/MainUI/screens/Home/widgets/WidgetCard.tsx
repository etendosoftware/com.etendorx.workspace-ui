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

import type { WidgetInstance, WidgetDataResponse } from "@workspaceui/api-client/src/api/dashboard";
import WidgetRenderer from "./WidgetRenderer";

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
  onRemove: (instanceId: string) => void;
}

export default function WidgetCard({ instance, data, error, onRemove }: WidgetCardProps) {
  const isLocked = instance.layer !== "USER";
  const isLoading = data === undefined && error === undefined;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl bg-baseline-10 p-5 h-full min-h-40"
      data-testid={`WidgetCard__${instance.instanceId}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-baseline-100 truncate">{instance.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          {isLocked && (
            <span
              className="text-baseline-50"
              title={`Widget del sistema (${instance.layer})`}
              data-testid={`WidgetCard__lock_${instance.instanceId}`}>
              <LockIcon data-testid="LockIcon__cb8729" />
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemove(instance.instanceId)}
            className="text-baseline-50 hover:text-baseline-100 transition-colors cursor-pointer rounded p-0.5 hover:bg-transparent-neutral-10"
            title={isLocked ? "Ocultar widget" : "Eliminar widget"}
            data-testid={`WidgetCard__remove_${instance.instanceId}`}>
            <CloseIcon data-testid="CloseIcon__cb8729" />
          </button>
        </div>
      </div>
      {/* Content */}
      {isLoading && (
        <div className="flex flex-col gap-2 animate-pulse" data-testid={`WidgetCard__loading_${instance.instanceId}`}>
          <div className="h-3 rounded bg-transparent-neutral-10 w-3/4" />
          <div className="h-3 rounded bg-transparent-neutral-10 w-1/2" />
          <div className="h-3 rounded bg-transparent-neutral-10 w-2/3" />
        </div>
      )}
      {error !== undefined && !isLoading && (
        <p className="text-sm text-error-main" data-testid={`WidgetCard__error_${instance.instanceId}`}>
          {error}
        </p>
      )}
      {data !== undefined && !error && (
        <WidgetRenderer type={instance.type} data={data.data} data-testid="WidgetRenderer__cb8729" />
      )}
    </div>
  );
}

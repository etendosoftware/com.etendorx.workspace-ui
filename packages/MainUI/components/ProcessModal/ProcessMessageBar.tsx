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

import { useSyncExternalStore } from "react";
import type { FC, SVGProps } from "react";
import InfoIcon from "../../../ComponentLibrary/src/assets/icons/info.svg";
import CheckCircleIcon from "../../../ComponentLibrary/src/assets/icons/check-circle.svg";
import AlertTriangleIcon from "../../../ComponentLibrary/src/assets/icons/alert-triangle.svg";
import AlertOctagonIcon from "../../../ComponentLibrary/src/assets/icons/alert-octagon.svg";
import CloseIcon from "../../../ComponentLibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getMessageBarState,
  type MessageBarSeverity,
  messageBar,
  subscribeMessageBar,
} from "@/utils/processes/definition/messageBarStore";

/** Per-severity border + accent colour (reusing existing CSS tokens) and icon. */
const SEVERITY_STYLES: Record<
  MessageBarSeverity,
  { border: string; accent: string; Icon: FC<SVGProps<SVGSVGElement>> }
> = {
  info: { border: "border-(--color-etendo-main)", accent: "text-(--color-etendo-main)", Icon: InfoIcon },
  success: { border: "border-(--color-success-main)", accent: "text-(--color-success-main)", Icon: CheckCircleIcon },
  warning: { border: "border-(--color-warning-main)", accent: "text-(--color-warning-main)", Icon: AlertTriangleIcon },
  error: { border: "border-(--color-error-main)", accent: "text-(--color-error-main)", Icon: AlertOctagonIcon },
};

/**
 * Renders the in-modal message bar requested by a migrated script through
 * `view.messageBar` / `messageBar`. Subscribes to the singleton store and shows
 * one sticky banner at a time, reusing the modal's existing banner visual
 * language (left-border accent on a neutral background). Mounted inside the
 * process modal. The message lifetime is owned by the modal (cleared on open),
 * not by this host: the host can unmount/remount during the modal's loading
 * transitions, so clearing here would wipe a message a script just set.
 */
export default function ProcessMessageBar() {
  const { t } = useTranslation();
  const state = useSyncExternalStore(subscribeMessageBar, getMessageBarState, getMessageBarState);

  if (!state) return null;

  const { border, accent, Icon } = SEVERITY_STYLES[state.severity];

  return (
    <div
      role="alert"
      className={`p-3 rounded mb-4 border-l-4 bg-gray-50 flex items-start gap-3 ${border}`}
      data-testid="ProcessMessageBar__container">
      <span className={`shrink-0 mt-0.5 ${accent}`}>
        <Icon className="w-5 h-5" data-testid="Icon__ab7595" />
      </span>
      <div className="flex-1 min-w-0">
        {state.title && <h4 className="font-bold text-sm mb-0.5">{state.title}</h4>}
        {/* Body is sanitized in the store via DOMPurify (formatting tags only). */}
        <div
          className="text-sm break-words"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: content is sanitized by sanitizeMessageHtml in the store.
          dangerouslySetInnerHTML={{ __html: state.html }}
        />
        {state.actions.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {state.actions.map((action, index) => (
              <button
                key={`${action.label}-${index}`}
                type="button"
                onClick={action.onClick}
                className="text-sm font-medium underline hover:opacity-80 transition-opacity"
                data-testid="ProcessMessageBar__action">
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => messageBar.hide()}
        aria-label={t("common.close")}
        className="shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
        data-testid="ProcessMessageBar__close">
        <CloseIcon className="w-4 h-4" data-testid="CloseIcon__ab7595" />
      </button>
    </div>
  );
}

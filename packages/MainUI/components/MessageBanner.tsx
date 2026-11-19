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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import type { FC, SVGProps } from "react";
import InfoIcon from "../../ComponentLibrary/src/assets/icons/info.svg";
import CheckCircleIcon from "../../ComponentLibrary/src/assets/icons/check-circle.svg";
import AlertTriangleIcon from "../../ComponentLibrary/src/assets/icons/alert-triangle.svg";
import AlertOctagonIcon from "../../ComponentLibrary/src/assets/icons/alert-octagon.svg";
import CloseIcon from "../../ComponentLibrary/src/assets/icons/x.svg";
import type { MessageBarSeverity } from "@/utils/processes/definition/messageBarStore";
import type { MessageBarAction } from "@/utils/processes/definition/scriptProxies";

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

export interface MessageBannerProps {
  severity: MessageBarSeverity;
  title?: string | null;
  /** Body HTML, already sanitized by the caller (`sanitizeMessageHtml`). */
  html: string;
  actions: MessageBarAction[];
  onClose: () => void;
  closeLabel: string;
  /** Prefix of the test ids: `<prefix>__container`, `<prefix>__action`, `<prefix>__close`. */
  testIdPrefix: string;
}

/**
 * Sticky message banner in the style of the classic message bar: left-border accent on a neutral background,
 * a severity icon, an optional title, a sanitized body, link-like actions and a close button.
 */
export default function MessageBanner({
  severity,
  title,
  html,
  actions,
  onClose,
  closeLabel,
  testIdPrefix,
}: MessageBannerProps) {
  const { border, accent, Icon } = SEVERITY_STYLES[severity];

  return (
    <div
      role="alert"
      className={`p-3 rounded mb-4 border-l-4 bg-gray-50 flex items-start gap-3 ${border}`}
      data-testid={`${testIdPrefix}__container`}>
      <span className={`shrink-0 mt-0.5 ${accent}`}>
        <Icon className="w-5 h-5" data-testid="Icon__ab7595" />
      </span>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold text-sm mb-0.5">{title}</h4>}
        <div
          className="text-sm break-words"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: callers pass HTML sanitized by sanitizeMessageHtml.
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {actions.map((action, index) => (
              <button
                key={`${action.label}-${index}`}
                type="button"
                onClick={action.onClick}
                className="text-sm font-medium underline hover:opacity-80 transition-opacity"
                data-testid={`${testIdPrefix}__action`}>
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
        data-testid={`${testIdPrefix}__close`}>
        <CloseIcon className="w-4 h-4" data-testid="CloseIcon__ab7595" />
      </button>
    </div>
  );
}

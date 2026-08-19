/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

/**
 * @fileoverview MiddlewareTokenProcess — the provider/scope chooser for "Get Middleware Token".
 *
 * Port of the hand-built DOM modal in ETRX_GetMiddlewareToken.js (:34-154). The classic dialog is a
 * two-level visual grid — a card per provider holding one icon button per scope — which no metadata
 * shape expresses, so this process renders a component instead of a parameter form.
 *
 * The one structural change is deliberate. Classic opens a blank popup during the click and navigates
 * it only after `getAccount()` resolves (:98-131), the usual trick for surviving a popup blocker.
 * Here the account id already arrived with the schema, so the click needs no `await` at all and opens
 * the popup directly at its final URL — the same outcome with one less thing to go wrong.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";
import { logger } from "@/utils/logger";
import { getScopeIcon } from "./scopeIcons";
import {
  POPUP_WINDOW_NAME,
  buildAuthState,
  buildAuthUrl,
  buildPopupFeatures,
  flattenScopeChoices,
  groupChoicesByProvider,
} from "./middlewareTokenUtils";
import type { CustomProcessComponentProps } from "../types";
import type { MiddlewareTokenSchema, ScopeChoice } from "./types";

/**
 * Error codes the onLoad and the proxy handler may report, mapped to their translation keys.
 *
 * The codes are stable identifiers; the English `message` travelling beside them is a diagnostic for
 * logs, never what the user reads. Listing the keys as literals (rather than interpolating the code)
 * keeps them typed and makes the set of reachable errors visible here.
 */
const ERROR_MESSAGE_KEYS = {
  noRecordSelected: "processModal.middlewareToken.errors.noRecordSelected",
  noProviderId: "processModal.middlewareToken.errors.noProviderId",
  providerNotFound: "processModal.middlewareToken.errors.providerNotFound",
  noEndpoint: "processModal.middlewareToken.errors.noEndpoint",
  unreadableResponse: "processModal.middlewareToken.errors.unreadableResponse",
  unreachable: "processModal.middlewareToken.errors.unreachable",
} as const;

const FALLBACK_ERROR_KEY = ERROR_MESSAGE_KEYS.unreachable;

export const MiddlewareTokenProcess: React.FC<CustomProcessComponentProps> = ({ schema, onClose }) => {
  const { t } = useTranslation();
  const userId = useUserStore((state) => state.user?.id ?? "");

  const tokenSchema = schema as MiddlewareTokenSchema;
  const { providers, accountId, redirectUri, startEndpoint, errorCode } = tokenSchema;

  /** Set when the browser refused the popup, so the user gets a clickable link instead. */
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);

  const providerGroups = useMemo(() => groupChoicesByProvider(flattenScopeChoices(providers)), [providers]);

  const handleScopeClick = useCallback(
    (choice: ScopeChoice) => {
      const url = buildAuthUrl({
        startEndpoint,
        providerId: choice.providerId,
        accountId,
        scope: choice.scope,
        redirectUri,
        state: buildAuthState(userId),
      });

      // Opened synchronously inside the click: no await runs before this line, so the call is still
      // inside the user-gesture window and no popup blocker intercepts it.
      const popup = window.open(url, POPUP_WINDOW_NAME, buildPopupFeatures(window.screen));

      if (!popup) {
        logger.warn("[MiddlewareTokenProcess] the authentication popup was blocked");
        setBlockedUrl(url);
        return;
      }

      onClose();
    },
    [accountId, onClose, redirectUri, startEndpoint, userId]
  );

  const renderBody = () => {
    if (errorCode) {
      // An unknown code still has to say something useful, so it degrades to the generic reason
      // rather than rendering the raw identifier.
      const messageKey = ERROR_MESSAGE_KEYS[errorCode as keyof typeof ERROR_MESSAGE_KEYS] ?? FALLBACK_ERROR_KEY;
      return (
        <div className="p-3 rounded border-l-4 bg-gray-50 border-red-500">
          <h4 className="font-bold text-sm text-red-600">{t("processModal.middlewareToken.errorTitle")}</h4>
          <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{t(messageKey)}</p>
        </div>
      );
    }

    if (providerGroups.length === 0) {
      return <p className="text-sm text-gray-600">{t("processModal.middlewareToken.noProviders")}</p>;
    }

    return providerGroups.map((group) => (
      <div key={group.label} className="rounded-lg border border-(--color-baseline-20) bg-white p-4 shadow-sm">
        <h4 className="m-0 text-base font-bold text-(--color-baseline-90)">{group.label}</h4>
        <p className="mt-1 mb-3 text-xs text-(--color-baseline-60)">{t("processModal.middlewareToken.selectScope")}</p>
        <hr className="border-0 border-t border-(--color-baseline-20)" />

        <div className="mt-3 flex flex-wrap gap-4">
          {group.choices.map((choice) => {
            const ScopeIcon = getScopeIcon(choice.scope);
            return (
              <div key={choice.scope} className="flex w-20 flex-col items-center">
                <button
                  type="button"
                  title={choice.description}
                  aria-label={choice.label}
                  onClick={() => handleScopeClick(choice)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg bg-(--color-baseline-90) transition-colors hover:bg-(--color-baseline-80) focus:outline-none focus:ring-2 focus:ring-(--color-etendo-main)">
                  <ScopeIcon className="h-6 w-6 fill-white" />
                </button>
                <span className="mt-1 text-center text-xs text-(--color-baseline-60)">{choice.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-(--color-baseline-20) p-4">
          <h3 className="text-lg font-bold">{t("processModal.middlewareToken.title")}</h3>
          <button
            type="button"
            onClick={onClose}
            title={t("processModal.middlewareToken.close")}
            aria-label={t("processModal.middlewareToken.close")}
            className="rounded-full p-1 hover:bg-(--color-baseline-10)">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          {renderBody()}

          {blockedUrl && (
            <div className="rounded border-l-4 border-amber-500 bg-gray-50 p-3">
              {/* Reuses the platform's existing popup-blocked wording so every process says the same
                  thing, instead of introducing a second phrasing for the same situation. */}
              <p className="text-sm text-gray-700">{t("process.popupBlocked")}</p>
              {/* A real anchor: the navigation comes from the user's own click, which no blocker intercepts. */}
              <a
                href={blockedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="mt-1 inline-block text-sm font-bold text-(--color-etendo-main) underline">
                {t("process.openLink")}
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-(--color-baseline-20) p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-(--color-baseline-10) px-4 py-2 text-sm hover:bg-(--color-baseline-20)">
            {t("processModal.middlewareToken.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
};

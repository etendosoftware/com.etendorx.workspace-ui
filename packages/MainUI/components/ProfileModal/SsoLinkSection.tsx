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

import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import type { SSOConfig } from "@/hooks/useSSO";
import { useServerLabels } from "@/hooks/useServerLabels";
import { useTranslation } from "@/hooks/useTranslation";
import { isSsoAccountLinkingEnabled } from "@/utils/session/ssoProvider";
import ProviderIconButtons from "../SSO/ProviderIconButtons";

/** Classic label of the Auth0 account linking button (com.etendoerp.etendorx). */
export const SSO_LINK_ACCOUNT_LABEL = "ETRX_LinkSSOAccount";
const SSO_LINK_LABEL_KEYS = [SSO_LINK_ACCOUNT_LABEL];

export interface SsoLinkSectionProps {
  config: SSOConfig | null;
  /** Links the account through a provider of the Etendo middleware. */
  onLinkProvider: (provider: string) => void;
  /** Links the account through Auth0. */
  onLinkAuth0: () => void;
}

/**
 * Account linking with the single sign-on provider, as classic `link-sso-account.js`: shown only with
 * `ETRX_AllowSSOLogin` = Y, with the provider icons of the Etendo middleware or the Auth0 button.
 */
export default function SsoLinkSection({ config, onLinkProvider, onLinkAuth0 }: SsoLinkSectionProps) {
  const { t } = useTranslation();
  const isEnabled = isSsoAccountLinkingEnabled(config);
  const isAuth0 = isEnabled && config.authType === "Auth0";
  const labels = useServerLabels(SSO_LINK_LABEL_KEYS, isAuth0);

  if (!isEnabled) {
    return null;
  }
  if (config.authType === "Auth0") {
    return (
      <div className="flex justify-center border-t border-(--color-transparent-neutral-10) px-4 pt-4 pb-6">
        <Button variant="outlined" onClick={onLinkAuth0} data-testid="profile-sso-link-auth0">
          {labels[SSO_LINK_ACCOUNT_LABEL] ?? t("navigation.profile.linkWith")}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 border-t border-(--color-transparent-neutral-10) px-4 pt-4 pb-6">
      <span className="font-inter font-medium text-sm text-(--color-transparent-neutral-70)">
        {t("navigation.profile.linkWith")}
      </span>
      <ProviderIconButtons
        providers={config.providers}
        onSelect={onLinkProvider}
        data-testid="ProviderIconButtons__75987a"
      />
    </div>
  );
}

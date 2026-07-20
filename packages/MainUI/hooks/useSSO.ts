"use client";
import { useCallback, useEffect, useState } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot/client";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "./useTranslation";
import { logger } from "../utils/logger";

type SSOConfig =
  | { enabled: false }
  | {
      enabled: true;
      authType: "Auth0";
      domain: string;
      clientId: string;
      callbackUrl: string;
    }
  | {
      enabled: true;
      authType: "Middleware";
      middlewareUrl: string;
      redirectUri: string;
      accountId: string;
      providers: { id: string; name: string }[];
    };

const STATE_KEY = "sso_state";
const redirectUri = () => (typeof window !== "undefined" ? window.location.origin : "");

function plumbToken(token: string) {
  localStorage.setItem("token", token);
  Metadata.setToken(token);
  datasource.setToken(token);
  CopilotClient.setToken(token);
  useUserStore.getState().setToken(token);
}

/**
 * SSO integration: config fetch + provider redirects.
 * Pass { autoCallback: true } (only the login screen does) to auto-exchange the
 * ?code/?access_token on return. Other consumers (e.g. profile linking) must not,
 * or they'd hijack the linking callback's access_token.
 */
export function useSSO({ autoCallback = false }: { autoCallback?: boolean } = {}) {
  const [config, setConfig] = useState<SSOConfig | null>(null);
  const { t } = useTranslation();
  const setLoginErrorText = useUserStore((s) => s.setLoginErrorText);
  const setLoginErrorDescription = useUserStore((s) => s.setLoginErrorDescription);

  useEffect(() => {
    fetch("/api/auth/sso/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch((e) => {
        logger.warn("Failed to load SSO config:", e);
        setConfig({ enabled: false });
      });
  }, []);

  const runCallback = useCallback(
    async (payload: Record<string, string>) => {
      try {
        const res = await fetch("/api/auth/sso/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          plumbToken(data.token);
          return;
        }
        const key = data.error === "no_user_linked" ? "notLinked" : "failed";
        setLoginErrorText(t(`login.sso.errors.${key}.title`));
        setLoginErrorDescription(t(`login.sso.errors.${key}.description`));
      } catch (e) {
        logger.warn("SSO callback error:", e);
        setLoginErrorText(t("login.sso.errors.failed.title"));
        setLoginErrorDescription(t("login.sso.errors.failed.description"));
      }
    },
    [t, setLoginErrorText, setLoginErrorDescription]
  );

  // On return from the provider, exchange the code/token then clean the URL.
  useEffect(() => {
    if (!autoCallback) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const accessToken = params.get("access_token");
    if (!code && !accessToken) return;

    window.history.replaceState({}, "", window.location.pathname);

    if (code) {
      const expected = sessionStorage.getItem(STATE_KEY);
      sessionStorage.removeItem(STATE_KEY);
      if (expected && params.get("state") !== expected) {
        setLoginErrorText(t("login.sso.errors.failed.title"));
        setLoginErrorDescription(t("login.sso.errors.failed.description"));
        return;
      }
      runCallback({ code, redirectUri: redirectUri() });
    } else if (accessToken) {
      runCallback({ accessToken });
    }
  }, [autoCallback, runCallback, t, setLoginErrorText, setLoginErrorDescription]);

  const startAuth0 = useCallback(() => {
    if (config?.enabled !== true || config.authType !== "Auth0") return;
    const state = crypto.randomUUID();
    sessionStorage.setItem(STATE_KEY, state);
    const url = new URL(`https://${config.domain}/authorize`);
    url.search = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: redirectUri(),
      scope: "openid profile email",
      state,
    }).toString();
    window.location.assign(url.toString());
  }, [config]);

  const middlewareRedirect = useCallback(
    (provider: string, redirect: string) => {
      if (config?.enabled !== true || config.authType !== "Middleware") return;
      const url = new URL(`${config.middlewareUrl}/login`);
      url.search = new URLSearchParams({
        provider,
        account_id: config.accountId,
        redirect_uri: redirect,
      }).toString();
      window.location.assign(url.toString());
    },
    [config]
  );

  // Login: middleware bounces ?access_token= back to our origin (handled above).
  const startMiddleware = useCallback(
    (provider: string) => middlewareRedirect(provider, redirectUri()),
    [middlewareRedirect]
  );

  // Account linking: bounce to a dedicated callback route so it isn't treated as a login.
  const startLink = useCallback(
    (provider: string) => middlewareRedirect(provider, `${redirectUri()}/sso/link-callback`),
    [middlewareRedirect]
  );

  return { config, startAuth0, startMiddleware, startLink };
}

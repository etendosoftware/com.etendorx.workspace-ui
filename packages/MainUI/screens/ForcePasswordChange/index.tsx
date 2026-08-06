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

import { useCallback, useEffect, useState } from "react";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import Input from "@/components/Forms/Input";
import LockIcon from "../../../ComponentLibrary/src/assets/icons/lock.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { useUserContext } from "@/hooks/useUserContext";
import { useUserStore } from "@/stores/userStore";
import { submitNewPassword } from "@/utils/password";
import { logger } from "@/utils/logger";

const BRAND_TITLE = "Etendo";

/**
 * Full-screen mandatory password-change flow, rendered instead of the application when the backend
 * reports the password as expired. It mirrors Etendo Classic, which reuses the login page to ask only
 * for the new password and its confirmation: the current password is the one just typed at login and
 * is supplied by the user context.
 */
export default function ForcePasswordChangeScreen() {
  const { completeExpiredPasswordChange, hasPendingLoginPassword, logout } = useUserContext();
  const { t } = useTranslation();
  const setLoginErrorText = useUserStore((s) => s.setLoginErrorText);
  const setLoginErrorDescription = useUserStore((s) => s.setLoginErrorDescription);

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // A page reload drops the password typed at login, which the ERP handler needs as the current one.
  // Classic keeps no session either, so send the user back to the login screen with an explanation.
  useEffect(() => {
    if (hasPendingLoginPassword()) {
      return;
    }
    setLoginErrorText(t("login.errors.passwordExpired.title"));
    setLoginErrorDescription(t("login.errors.passwordExpired.description"));
    logout().catch(logger.warn);
  }, [hasPendingLoginPassword, logout, setLoginErrorDescription, setLoginErrorText, t]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage("");
      setIsLoading(true);

      const errorKey = await submitNewPassword({ newPwd, confirmPwd }, completeExpiredPasswordChange);

      setErrorMessage(errorKey ? t(errorKey) : "");
      setIsLoading(false);
    },
    [completeExpiredPasswordChange, confirmPwd, newPwd, t]
  );

  return (
    <div className="bg-login flex flex-1 items-center justify-center pb-[10vh] flex-column">
      <div className="w-100 bg-(--color-baseline-0) border border-(--color-transparent-neutral-10) rounded-xl overflow-hidden shadow-[0px_4px_10px_0px_var(--color-transparent-neutral-10)]">
        <div className="h-14 flex items-center gap-2 pl-6 bg-(--color-baseline-10) border-b border-(--color-transparent-neutral-10)">
          <div className="logo h-8 w-8" />
          <div className="font-inter font-semibold text-sm text-(--color-baseline-100) leading-[20px] tracking-[0.15px] align-middle">
            {BRAND_TITLE}
          </div>
        </div>
        <form className="py-6 px-8" onSubmit={handleSubmit} noValidate>
          <div className="font-inter text-(--color-baseline-100) font-semibold text-2xl leading-7 tracking-normal">
            {t("login.passwordExpired.title")}
          </div>
          <div className="font-inter text-(--color-transparent-neutral-70) font-medium text-xs leading-4 tracking-normal mt-1 mb-3">
            {t("login.passwordExpired.description")}
          </div>

          <Input
            icon={LockIcon}
            label={t("navigation.profile.newPasswordLabel")}
            required
            type="password"
            name="newPassword"
            id="newPassword"
            value={newPwd}
            onChange={(event) => setNewPwd(event.target.value)}
            autoComplete="new-password"
            data-testid="ForcePasswordChange__newPassword"
          />

          <div className="my-2" />

          <Input
            icon={LockIcon}
            label={t("navigation.profile.confirmPasswordLabel")}
            required
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            value={confirmPwd}
            onChange={(event) => setConfirmPwd(event.target.value)}
            autoComplete="new-password"
            data-testid="ForcePasswordChange__confirmPassword"
          />

          {errorMessage && (
            <div
              className="font-inter font-medium text-xs text-(--color-error-main) leading-4 mt-2"
              data-testid="ForcePasswordChange__error">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            className="mt-6"
            size="large"
            disabled={!newPwd || !confirmPwd || isLoading}
            data-testid="ForcePasswordChange__submit">
            {isLoading ? (
              <Spinner size={20} color="inherit" data-testid="ForcePasswordChange__spinner" />
            ) : (
              t("login.passwordExpired.submit")
            )}
          </Button>

          <button
            type="button"
            onClick={() => logout().catch(logger.warn)}
            className="w-full mt-4 font-inter font-medium text-xs text-(--color-transparent-neutral-70) leading-4 hover:text-(--color-baseline-100) transition-colors"
            data-testid="ForcePasswordChange__logout">
            {t("login.passwordExpired.logout")}
          </button>
        </form>
      </div>
    </div>
  );
}

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
import { useCallback, useState } from "react";
import type { LoginProps } from "../types";
import { useTranslation } from "../../../hooks/useTranslation";
import "./Login.css";
import Input from "../Input";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import UserIcon from "../../../../ComponentLibrary/src/assets/icons/user.svg";
import LockIcon from "../../../../ComponentLibrary/src/assets/icons/lock.svg";
import GoogleIcon from "../../../../ComponentLibrary/src/assets/icons/ilustration/google.svg";

export default function Login({ title, onSubmit, error }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();

  const handleUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.currentTarget.value),
    []
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value),
    []
  );

  const handleSubmit = useCallback<React.FormEventHandler>(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await onSubmit(username, password);
    },
    [onSubmit, password, username]
  );

  return (
    <div className="bg-login flex flex-1 items-center justify-center pb-[10vh] flex-column">
      <div className="w-100 bg-(--color-baseline-0) border border-(--color-transparent-neutral-10) rounded-xl overflow-hidden  shadow-[0px_4px_10px_0px_var(--color-transparent-neutral-10)]">
        <div className="h-14 flex items-center gap-2 pl-6 bg-(--color-baseline-10) border-b border-(--color-transparent-neutral-10)">
          <div className="logo h-8 w-8" />
          <div className="font-inter font-semibold text-sm text-(--color-baseline-100) leading-[20px] tracking-[0.15px] align-middle">
            {title}
          </div>
        </div>
        <form className="py-6 px-8" onSubmit={handleSubmit} noValidate>
          <div className="font-inter text-(--color-baseline-100) font-semibold text-2xl leading-7 tracking-normal">
            {t("login.title")}
          </div>
          <div className="font-inter text-(--color-transparent-neutral-70) font-medium text-xs leading-4 tracking-normal mt-1 mb-3">
            {t("login.subtitle")}
          </div>
          <Input
            icon={UserIcon}
            label={t("login.fields.username.placeholder")}
            required
            type="text"
            name="username"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            autoComplete="username"
          />
          <div className="my-2" />
          <Input
            icon={LockIcon}
            label={t("login.fields.password.placeholder")}
            required
            type="password"
            name="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            autoComplete="current-password"
          />
          <Button type="submit" className="mt-6" size="large">
            {t("login.buttons.submit")}
          </Button>
          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-(--color-transparent-neutral-10)" />
            <span className="font-inter font-medium text-xs leading-4 tracking-normal mx-4 border-(--color-transparent-neutral-70)">
              {t("login.buttons.google")}
            </span>
            <div className="flex-grow border-t border-(--color-transparent-neutral-10)" />
          </div>
          <Button disabled variant="outlined" type="submit" size="large" startIcon={<GoogleIcon />}>
            {t("login.buttons.google")}
          </Button>
        </form>
      </div>
      {error && <div className="font-medium text-sm text-(--color-error-main) mt-4">{error}</div>}
    </div>
  );
}

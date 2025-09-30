"use client";
import { useCallback, useState, useEffect } from "react";
import type { LoginProps } from "../types";
import { useTranslation } from "../../../hooks/useTranslation";
import "./Login.css";
import Input from "../Input";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import UserIcon from "../../../../ComponentLibrary/src/assets/icons/user.svg";
import LockIcon from "../../../../ComponentLibrary/src/assets/icons/lock.svg";
import GoogleIcon from "../../../../ComponentLibrary/src/assets/icons/ilustration/google.svg";
import Version from "@workspaceui/componentlibrary/src/components/Version";
import { useUserContext } from "@/hooks/useUserContext";

export default function Login({ title, onSubmit }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [progressWidth, setProgressWidth] = useState(0);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const { t } = useTranslation();

  const { loginErrorText, setLoginErrorText, loginErrorDescription, setLoginErrorDescription } = useUserContext();

  useEffect(() => {
    if (loginErrorText) {
      setShowErrorMessage(true);
      setProgressWidth(100);

      const totalDuration = 5000; // 5 seconds
      const updateInterval = 50; // Update every 50ms
      const decrementValue = (100 / totalDuration) * updateInterval;

      const timer = setInterval(() => {
        setProgressWidth((prevWidth) => {
          const newWidth = prevWidth - decrementValue;

          if (newWidth <= 0) {
            clearInterval(timer);
            setShowErrorMessage(false);
            setLoginErrorText("");
            setLoginErrorDescription("");
            return 0;
          }

          return newWidth;
        });
      }, updateInterval);

      return () => {
        clearInterval(timer);
        setShowErrorMessage(false);
        setLoginErrorText("");
        setLoginErrorDescription("");
      };
    }
  }, [loginErrorText, setLoginErrorText, setLoginErrorDescription]);

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
      <div className="w-100 bg-(--color-baseline-0) border border-(--color-transparent-neutral-10) rounded-xl overflow-hidden shadow-[0px_4px_10px_0px_var(--color-transparent-neutral-10)]">
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
            data-testid="Input__602739"
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
            data-testid="Input__602739"
          />

          <Button type="submit" className="mt-6" size="large" data-testid="Button__602739">
            {t("login.buttons.submit")}
          </Button>

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-(--color-transparent-neutral-10)" />
            <span className="font-inter font-medium text-xs leading-4 tracking-normal mx-4 border-(--color-transparent-neutral-70)">
              {t("login.buttons.google")}
            </span>
            <div className="flex-grow border-t border-(--color-transparent-neutral-10)" />
          </div>

          <Button
            disabled
            variant="outlined"
            type="submit"
            size="large"
            startIcon={<GoogleIcon data-testid="GoogleIcon__602739" />}
            data-testid="Button__602739">
            {t("login.buttons.google")}
          </Button>
        </form>
        <Version
          title={`Copyright © 2021-${new Date().getFullYear()} FUTIT SERVICES, S.L.\n${t("common.version")} ${process.env.NEXT_PUBLIC_APP_VERSION}`}
          customClassNameSpan="mt-0 mb-6 whitespace-pre-line"
          data-testid="Version__602739"
        />
      </div>
      {showErrorMessage && (
        <div className="w-100 mt-4 p-4 bg-(--color-baseline-0) border border-(--color-error-main) rounded-lg max-w-md shadow-[0px_4px_10px_0px_var(--color-transparent-neutral-10)]">
          <div className="font-inter font-semibold text-sm text-(--color-error-main) leading-5 mb-2">
            {loginErrorText}
          </div>
          <div className="font-inter font-normal text-xs text-(--color-transparent-neutral-70) leading-4 mb-3">
            {loginErrorDescription}
          </div>
          <div className="w-full bg-(--color-transparent-neutral-10) rounded-full h-1">
            <div
              className="bg-(--color-error-main) h-1 rounded-full transition-all duration-50 ease-linear"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

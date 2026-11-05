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
 * All portions are Copyright (C) 2021-2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { useState, type FocusEvent } from "react";
import { TextInput } from "./components/TextInput";
import { useFormContext, useWatch, type FieldValues } from "react-hook-form";
import { useTranslation } from "@/hooks/useTranslation";
import { isValidLinkUrl, toOpenableLinkUrl } from "@/utils/form/linkUrl";

interface LinkSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

export const LinkSelector = ({ field, isReadOnly }: LinkSelectorProps) => {
  const { register, setValue } = useFormContext<FieldValues>();
  const fieldName = field.hqlName;
  const currentValue = useWatch({ name: fieldName }) as string | undefined;
  const { t } = useTranslation();
  // Like Classic's `validateOnExit`, the URL is only flagged once the user leaves the field.
  const [hasBlurred, setHasBlurred] = useState(false);
  const openableUrl = toOpenableLinkUrl(currentValue);

  if (isReadOnly) {
    if (!currentValue) {
      return <span className="text-sm text-gray-400 h-10.5 flex items-center px-3">&mdash;</span>;
    }

    return (
      <a
        href={openableUrl ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-(--ui-link) underline hover:brightness-75 truncate block h-10.5 flex items-center px-3 max-w-full"
        title={currentValue}>
        {currentValue}
      </a>
    );
  }

  const handleSetValue = (value: string) => {
    setValue(fieldName, value, { shouldValidate: true });
  };

  const handleOpenLink = () => {
    if (openableUrl) {
      window.open(openableUrl, "_blank", "noopener,noreferrer");
    }
  };

  const registration = register(fieldName);

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setHasBlurred(true);
    return registration.onBlur(event);
  };

  const errorText = hasBlurred && !isValidLinkUrl(currentValue) ? t("form.link.invalidUrl") : undefined;

  const linkButton = openableUrl ? (
    <button
      type="button"
      onClick={handleOpenLink}
      className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors z-10"
      title="Open link"
      data-testid={`LinkSelector__open__${field.id}`}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <title>Open link</title>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  ) : null;

  return (
    <TextInput
      {...registration}
      onBlur={handleBlur}
      field={field}
      setValue={handleSetValue}
      showClearButton={true}
      endAdornment={linkButton}
      errorText={errorText}
      value={currentValue}
      placeholder="https://..."
      data-testid={`LinkSelector__${field.id}`}
    />
  );
};

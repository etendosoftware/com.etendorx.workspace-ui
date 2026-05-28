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
import { TextInput } from "./components/TextInput";
import { useFormContext, type FieldValues } from "react-hook-form";

interface LinkSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

export const LinkSelector = ({ field, isReadOnly }: LinkSelectorProps) => {
  const { register, watch, setValue } = useFormContext<FieldValues>();
  const fieldName = field.hqlName;
  const currentValue = watch(fieldName) as string | undefined;

  if (isReadOnly) {
    if (!currentValue) {
      return <span className="text-sm text-gray-400 h-10.5 flex items-center px-3">&mdash;</span>;
    }

    return (
      <a
        href={currentValue}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 underline hover:text-blue-800 truncate block h-10.5 flex items-center px-3 max-w-full"
        title={currentValue}>
        {currentValue}
      </a>
    );
  }

  const handleSetValue = (value: string) => {
    setValue(fieldName, value, { shouldValidate: true });
  };

  const handleOpenLink = () => {
    if (currentValue) {
      window.open(currentValue, "_blank", "noopener,noreferrer");
    }
  };

  const linkButton = currentValue ? (
    <button
      type="button"
      onClick={handleOpenLink}
      className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors z-10"
      title="Open link"
      data-testid={`LinkSelector__open__${field.id}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <title>Open link</title>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  ) : null;

  return (
    <TextInput
      {...register(fieldName)}
      field={field}
      setValue={handleSetValue}
      showClearButton={true}
      endAdornment={linkButton}
      value={currentValue}
      placeholder="https://..."
      data-testid={`LinkSelector__${field.id}`}
    />
  );
};

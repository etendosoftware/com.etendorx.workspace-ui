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

import { useState } from "react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextInput } from "./components/TextInput";
import { useFormContext, type FieldValues } from "react-hook-form";
import { PASSWORD_PLACEHOLDER } from "@/utils/form/constants";

const EyeIcon = ({ open }: { open: boolean }): React.ReactElement => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    role="img"
    aria-label={open ? "Hide password" : "Show password"}>
    <title>{open ? "Hide password" : "Show password"}</title>
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

export const PasswordSelector = (
  props: { field: Field } & React.ComponentProps<typeof TextInput>
): React.ReactElement => {
  const { register, watch, setValue } = useFormContext<FieldValues>();
  const fieldName = props.field.hqlName;
  const currentValue = watch(fieldName);
  const [showPassword, setShowPassword] = useState(false);

  const handleSetValue = (value: string): void => {
    setValue(fieldName, value, { shouldValidate: true });
  };

  const isPlaceholder = currentValue === PASSWORD_PLACEHOLDER;

  const eyeToggle =
    !isPlaceholder && currentValue ? (
      <button
        type="button"
        data-testid={`eye-toggle__${props.field.id}`}
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10">
        <EyeIcon open={showPassword} />
      </button>
    ) : null;

  return (
    <TextInput
      {...register(fieldName)}
      field={props.field}
      setValue={handleSetValue}
      showClearButton={false}
      endAdornment={eyeToggle}
      value={currentValue}
      type={showPassword ? "text" : "password"}
      maxLength={Number(props.field.column.length)}
      autoComplete="new-password"
      data-testid="TextInput__1b1414"
    />
  );
};

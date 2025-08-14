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

import type { Field } from "@workspaceui/api-client/src/api/types";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { TextInput } from "./components/TextInput";

type NumericType = "integer" | "decimal";

interface UnifiedNumericSelectorProps extends React.ComponentProps<typeof TextInput> {
  field: Field;
  type?: NumericType;
}

export const UnifiedNumericSelector = ({ field, type = "decimal", ...props }: UnifiedNumericSelectorProps) => {
  const { register, setValue, watch, formState } = useFormContext();
  const formValue = watch(field.hqlName);
  const [localValue, setLocalValue] = useState(formValue === null || formValue === undefined ? "" : String(formValue));
  const [isFocused, setIsFocused] = useState(false);
  const isDirty = formState.isDirty;

  const isInteger = type === "integer" || field.column.reference === "11";

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(formValue === null || formValue === undefined ? "" : String(formValue));
    }
  }, [formValue, isFocused]);

  const getValidationRegex = useCallback(() => {
    if (isInteger) {
      return /^-?\d*$/;
    }
    return /^-?(?:\d+\.?\d*|\.\d+)$/;
  }, [isInteger]);

  const parseValue = useCallback(
    (value: string): number | null => {
      if (value === "" || value === null || value === undefined) {
        return field.isMandatory || props.required ? 0 : null;
      }

      const stringValue = String(value).trim();

      if (stringValue === "" || stringValue === "-" || stringValue === ".") {
        return field.isMandatory || props.required ? 0 : null;
      }

      const normalizedValue = stringValue.replace(",", ".");

      const numericValue = isInteger ? Number.parseInt(normalizedValue, 10) : Number.parseFloat(normalizedValue);

      if (Number.isNaN(numericValue)) {
        return field.isMandatory || props.required ? 0 : null;
      }

      return numericValue;
    },
    [isInteger, field.isMandatory, props.required]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;

      if (isInteger) {
        value = value.replace(/[^\d.-]/g, "");
        value = value.replace(/(?!^)-/g, "");
        value = value.replace(/\./g, "");
      }

      const regex = getValidationRegex();

      if (value === "" || regex.test(value)) {
        setLocalValue(value);

        if (props.onChange) {
          props.onChange(event);
        }
        if (!isDirty) {
          const parsedValue = parseValue(value);
          setValue(field.hqlName, parsedValue);
        }
      }
    },
    [isInteger, getValidationRegex, props, isDirty, field.hqlName, parseValue, setValue]
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      if (props.onFocus) {
        props.onFocus(event);
      }
    },
    [props]
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      const parsedValue = parseValue(localValue);
      setValue(field.hqlName, parsedValue);

      if (parsedValue === null) {
        setLocalValue("");
      } else {
        setLocalValue(String(parsedValue));
      }

      if (props.onBlur) {
        props.onBlur(event);
      }
    },
    [localValue, parseValue, field.hqlName, setValue, props]
  );

  const registerProps = register(field.hqlName);

  return (
    <TextInput
      {...props}
      field={field}
      name={registerProps.name}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      value={localValue}
      ref={registerProps.ref}
      inputMode={isInteger ? "numeric" : "decimal"}
      pattern={isInteger ? "^-?\\d*$" : "^-?(?:\\d+\\.?\\d*|\\.\\d+)$"}
    />
  );
};

export const NumericSelector = (props: { field: Field } & React.ComponentProps<typeof TextInput>) => (
  <UnifiedNumericSelector {...props} type="decimal" />
);

export const IntegerSelector = (props: { field: Field } & React.ComponentProps<typeof TextInput>) => (
  <UnifiedNumericSelector {...props} type="integer" />
);

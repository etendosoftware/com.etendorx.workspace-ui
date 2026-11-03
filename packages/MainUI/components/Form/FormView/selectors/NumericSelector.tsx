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
import { useFormContext, useWatch } from "react-hook-form";
import { useLanguage } from "@/contexts/language";
import { getNumericFormatOptions } from "@/utils";
import { TextInput } from "./components/TextInput";

type NumericType = "integer" | "decimal";

/** `setValue` options of a value typed by the user, with `dirtyOnEdit`. */
const EDITED_VALUE_OPTIONS = { shouldDirty: true } as const;

interface UnifiedNumericSelectorProps extends React.ComponentProps<typeof TextInput> {
  field: Field;
  type?: NumericType;
  /**
   * Marks the value the user types as edited (dirty). A process modal sets it, so a later
   * re-application of the process defaults (`keepDirtyValues`) keeps what the user typed.
   */
  dirtyOnEdit?: boolean;
}

interface NumericSelectorProps extends React.ComponentProps<typeof TextInput> {
  field: Field;
  type?: NumericType;
  dirtyOnEdit?: boolean;
}

export const UnifiedNumericSelector = ({
  field,
  type = "decimal",
  dirtyOnEdit = false,
  ...props
}: UnifiedNumericSelectorProps) => {
  const { register, setValue, formState } = useFormContext();
  const editOptions = dirtyOnEdit ? EDITED_VALUE_OPTIONS : undefined;
  const { language } = useLanguage();
  const formValue = useWatch({ name: field.hqlName });
  const [localValue, setLocalValue] = useState(formValue === null || formValue === undefined ? "" : String(formValue));
  const [isFocused, setIsFocused] = useState(false);
  const isDirty = formState.isDirty;

  const isInteger = type === "integer" || field.column.reference === "11";

  const getDecimalSeparator = useCallback((): string => {
    const locale = (language ?? "en_US").replace("_", "-");
    const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
    return parts.find((p) => p.type === "decimal")?.value ?? ".";
  }, [language]);

  const normalizeDecimalInput = useCallback(
    (value: string): string => {
      const separator = getDecimalSeparator();
      return separator === "," ? value.replace(",", ".") : value;
    },
    [getDecimalSeparator]
  );

  // Thousands separators are presentation only: shown while the field is not being edited, and dropped on
  // focus so the value can be typed and parsed as before. Integers keep their plain format.
  const formatValue = useCallback(
    (value: number, grouped: boolean): string => {
      if (isInteger) {
        return String(value);
      }
      const locale = (language ?? "en_US").replace("_", "-");
      const formatOptions = getNumericFormatOptions(field.column?.reference, field.column?.valueFormat);
      return new Intl.NumberFormat(locale, { ...formatOptions, useGrouping: grouped }).format(value);
    },
    [isInteger, language, field.column]
  );

  const formatDisplayValue = useCallback((value: number): string => formatValue(value, true), [formatValue]);
  const formatEditValue = useCallback((value: number): string => formatValue(value, false), [formatValue]);

  useEffect(() => {
    if (!isFocused) {
      if (formValue === null || formValue === undefined) {
        setLocalValue("");
      } else {
        setLocalValue(formatDisplayValue(Number(formValue)));
      }
    }
  }, [formValue, isFocused, formatDisplayValue]);

  const getValidationRegex = useCallback(() => {
    if (isInteger) {
      return /^-?\d*$/;
    }
    return /^-?\d*[.,]?\d*$/;
  }, [isInteger]);

  const parseValue = useCallback(
    (value: string): number | null => {
      if (value === "" || value === null || value === undefined) {
        return field.isMandatory || props.required ? 0 : null;
      }

      const stringValue = String(value).trim();

      if (stringValue === "" || stringValue === "-" || stringValue === "." || stringValue === ",") {
        return field.isMandatory || props.required ? 0 : null;
      }

      const normalizedValue = normalizeDecimalInput(stringValue);

      const numericValue = isInteger ? Number.parseInt(normalizedValue, 10) : Number.parseFloat(normalizedValue);

      if (Number.isNaN(numericValue)) {
        return field.isMandatory || props.required ? 0 : null;
      }

      return numericValue;
    },
    [isInteger, field.isMandatory, props.required, normalizeDecimalInput]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    const clearedValue = field.isMandatory || props.required ? 0 : null;
    setValue(field.hqlName, clearedValue, editOptions);

    if (props.onClear) {
      props.onClear();
    }
  }, [field.isMandatory, field.hqlName, props, setValue, editOptions]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;

      if (isInteger) {
        value = value.replace(/[^\d.-]/g, "");
        value = value.replace(/(?!^)-/g, "");
        value = value.replace(/[.,]/g, "");
      } else {
        value = value.replace(/[^\d.,-]/g, "");
        value = value.replace(/(?!^)-/g, "");

        const separatorCount = (value.match(/[.,]/g) || []).length;
        if (separatorCount > 1) {
          return;
        }
      }

      const regex = getValidationRegex();

      if (value === "" || regex.test(value)) {
        setLocalValue(value);

        if (props.onChange) {
          props.onChange(event);
        }
        if (!isDirty) {
          const parsedValue = parseValue(value);
          setValue(field.hqlName, parsedValue, editOptions);
        }
      }
    },
    [isInteger, getValidationRegex, props, isDirty, field.hqlName, parseValue, setValue, editOptions]
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      // Back to the editable (ungrouped) format. The grouped text cannot be parsed, so start from the form value.
      const currentValue = Number(formValue);
      if (formValue !== null && formValue !== undefined && formValue !== "" && !Number.isNaN(currentValue)) {
        setLocalValue(formatEditValue(currentValue));
      }

      if (props.onFocus) {
        props.onFocus(event);
      }
    },
    [props, formValue, formatEditValue]
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      const parsedValue = parseValue(localValue);
      setValue(field.hqlName, parsedValue, editOptions);

      if (parsedValue === null) {
        setLocalValue("");
      } else {
        setLocalValue(formatDisplayValue(parsedValue));
      }

      if (props.onBlur) {
        props.onBlur(event);
      }
    },
    [localValue, parseValue, field.hqlName, setValue, props, formatDisplayValue, editOptions]
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
      onClear={handleClear}
      value={localValue}
      ref={registerProps.ref}
      data-testid="TextInput__329fab"
    />
  );
};

export const NumericSelector = ({ type = "decimal", ...props }: NumericSelectorProps) => (
  <UnifiedNumericSelector {...props} type={type} data-testid="UnifiedNumericSelector__329fab" />
);

export const IntegerSelector = (props: { field: Field } & React.ComponentProps<typeof TextInput>) => (
  <UnifiedNumericSelector {...props} type="integer" data-testid="UnifiedNumericSelector__329fab" />
);

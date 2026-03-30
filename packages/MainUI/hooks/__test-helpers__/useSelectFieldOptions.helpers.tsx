import type React from "react";
import { FormProvider, useForm } from "react-hook-form";

/**
 * Wrapper component that provides FormContext with default values
 * Used for testing hooks that depend on react-hook-form
 */
export const FormContextWrapper = ({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues: Record<string, unknown>;
}) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

/**
 * Creates a minimal field object for testing TableDir selectors
 */
export const createFieldMock = (overrides: Record<string, unknown> = {}) => ({
  hqlName: "table",
  column: { reference: 19 },
  ...overrides,
});

/**
 * Creates a minimal record object with id and _identifier
 */
export const createRecordMock = (id: string, identifier: string, overrides: Record<string, unknown> = {}) => ({
  id,
  _identifier: identifier,
  ...overrides,
});

/**
 * Creates default form values for a field with optional current value
 */
export const createDefaultFormValues = (
  fieldName: string,
  currentValue?: string,
  currentIdentifier?: string
) => ({
  [fieldName]: currentValue || undefined,
  [`${fieldName}$_identifier`]: currentIdentifier || undefined,
});

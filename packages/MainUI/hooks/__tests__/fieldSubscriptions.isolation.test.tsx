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

import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useFieldValue } from "../useFieldValue";
import { useSelectFieldOptions } from "../useSelectFieldOptions";

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
}));

const field = { hqlName: "paymentTerms", columnName: "C_PaymentTerm_ID", column: {} } as unknown as Field;

/**
 * The form host (the component that calls useForm, like FormView) must not re-render when a field read
 * by these hooks changes: a render-time watch() subscribes the host, and every useFormContext consumer
 * re-renders with it.
 */
const setup = <T,>(useHook: () => T) => {
  let methods: UseFormReturn | undefined;
  let hostRenders = 0;
  const Host = ({ children }: { children: ReactNode }) => {
    hostRenders++;
    methods = useForm({ defaultValues: { paymentTerms: "A", paymentTerms$_identifier: "30 days" } });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  const hook = renderHook(useHook, { wrapper: Host });
  return { hook, methods: () => methods as UseFormReturn, hostRenders: () => hostRenders };
};

describe("field hooks subscribe locally", () => {
  it("useFieldValue follows the field without re-rendering the form host", () => {
    const { hook, methods, hostRenders } = setup(() => useFieldValue(field));
    const rendersBefore = hostRenders();

    act(() => {
      methods().setValue("paymentTerms", "B");
      methods().setValue("paymentTerms$_identifier", "60 days");
    });

    expect(hook.result.current.value).toBe("B");
    expect(hook.result.current.displayValue).toBe("60 days");
    expect(hostRenders()).toBe(rendersBefore);
  });

  it("useSelectFieldOptions adds the new current value without re-rendering the form host", () => {
    const { hook, methods, hostRenders } = setup(() => useSelectFieldOptions(field, []));
    const rendersBefore = hostRenders();

    act(() => {
      methods().setValue("paymentTerms", "B");
      methods().setValue("paymentTerms$_identifier", "60 days");
    });

    expect(hook.result.current).toEqual([{ id: "B", label: "60 days", data: {} }]);
    expect(hostRenders()).toBe(rendersBefore);
  });
});

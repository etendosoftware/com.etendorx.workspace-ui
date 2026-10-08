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
import { useDisplayLogicFormValues } from "../useDisplayLogicFormValues";

const fields = {
  status: { hqlName: "docStatus", columnName: "DocStatus" },
  total: { hqlName: "grandTotal", displayLogicExpression: "OB.Utilities.getValue(currentValues,'docStatus') === 'DR'" },
} as unknown as Record<string, Field>;

const setup = (extraNames?: string[]) => {
  let methods: UseFormReturn | undefined;
  let renders = 0;
  const Wrapper = ({ children }: { children: ReactNode }) => {
    methods = useForm({ defaultValues: { docStatus: "DR", description: "", _identifier: "SO-1" } });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  const hook = renderHook(
    () => {
      renders++;
      return useDisplayLogicFormValues(fields, extraNames);
    },
    { wrapper: Wrapper }
  );
  return { hook, methods: () => methods as UseFormReturn, renders: () => renders };
};

describe("useDisplayLogicFormValues", () => {
  it("returns all the current form values", () => {
    const { hook } = setup();
    expect(hook.result.current).toEqual({ docStatus: "DR", description: "", _identifier: "SO-1" });
  });

  it("returns the new values when a field the display logic reads changes", () => {
    const { hook, methods } = setup();
    act(() => methods().setValue("docStatus", "CO"));
    expect(hook.result.current.docStatus).toBe("CO");
  });

  it("does not re-render, and keeps the same values object, when only an unrelated field changes", () => {
    const { hook, methods, renders } = setup();
    const before = hook.result.current;
    const rendersBefore = renders();
    act(() => methods().setValue("description", "perf"));
    expect(renders()).toBe(rendersBefore);
    expect(hook.result.current).toBe(before);
  });

  it("follows extra names", () => {
    const { hook, methods } = setup(["_identifier"]);
    act(() => methods().setValue("_identifier", "SO-2"));
    expect(hook.result.current._identifier).toBe("SO-2");
  });

  it("returns the new values after a reset", () => {
    const { hook, methods } = setup();
    act(() => methods().reset({ docStatus: "CO", description: "x", _identifier: "SO-9" }));
    expect(hook.result.current).toEqual({ docStatus: "CO", description: "x", _identifier: "SO-9" });
  });
});

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

import type React from "react";
import { renderHook } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { createSmartContext } from "@/utils/expressions";
import { useFormValidation } from "../useFormValidation";

jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: jest.fn(() => () => true),
}));
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: any) => any) => selector({ session: {} }),
}));
jest.mock("@/utils/expressions", () => {
  const actual = jest.requireActual("@/utils/expressions");
  return { ...actual, createSmartContext: jest.fn(actual.createSmartContext) };
});

const mockedCreate = createSmartContext as jest.Mock;

const requiredWithLogic = (hqlName: string) =>
  ({
    hqlName,
    name: hqlName,
    isMandatory: true,
    displayed: true,
    isReadOnly: false,
    column: { reference: "10" },
    displayLogicExpression: "@a@ = 'Y'",
  }) as unknown as Field;

const tab = {
  id: "t1",
  window: "W1",
  fields: { f1: requiredWithLogic("f1"), f2: requiredWithLogic("f2"), f3: requiredWithLogic("f3") },
} as unknown as Tab;

const wrapperWith =
  (defaultValues: Record<string, unknown>) =>
  ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
  };

describe("useFormValidation — evaluation context", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds one context per validation pass, not one per required field", () => {
    const { result } = renderHook(() => useFormValidation(tab), {
      wrapper: wrapperWith({ f1: "x", f2: "y", f3: "z" }),
    });
    result.current.validateRequiredFields();
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it("builds no context while the form has no values", () => {
    const { result } = renderHook(() => useFormValidation(tab), { wrapper: wrapperWith({}) });
    result.current.validateRequiredFields();
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("falls back per field and retries when a build throws", () => {
    mockedCreate.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { result } = renderHook(() => useFormValidation(tab), {
      wrapper: wrapperWith({ f1: "x", f2: "y", f3: "z" }),
    });
    expect(() => result.current.validateRequiredFields()).not.toThrow();
    expect(mockedCreate).toHaveBeenCalledTimes(2);
  });

  it("isFieldDisplayed without a getter still builds its own context", () => {
    const { result } = renderHook(() => useFormValidation(tab), {
      wrapper: wrapperWith({ f1: "x" }),
    });
    expect(result.current.isFieldDisplayed(requiredWithLogic("f1"))).toBe(true);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });
});

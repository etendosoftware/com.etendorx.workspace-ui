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

import { act, renderHook } from "@testing-library/react";
import { useServerFieldError, useServerFieldErrorsStore } from "../serverFieldErrorsStore";

const SCOPE = "form:TAB1";
const OTHER_SCOPE = "form:TAB2";
const REFERENCE_NO = "referenceNo";
const NAME = "name";
const TOO_LONG = "Value too long";

const store = () => useServerFieldErrorsStore.getState();
const setErrors = (errors: Record<string, string>, scope = SCOPE) => act(() => store().setFieldErrors(scope, errors));

describe("serverFieldErrorsStore", () => {
  beforeEach(() => {
    useServerFieldErrorsStore.setState({ errors: {} });
  });

  it("replaces the errors of a scope and keeps the other scopes", () => {
    setErrors({ [NAME]: TOO_LONG });
    setErrors({ [NAME]: TOO_LONG }, OTHER_SCOPE);
    setErrors({ [REFERENCE_NO]: TOO_LONG });

    expect(store().errors).toEqual({ [SCOPE]: { [REFERENCE_NO]: TOO_LONG }, [OTHER_SCOPE]: { [NAME]: TOO_LONG } });
  });

  it("clears the error of one field", () => {
    setErrors({ [REFERENCE_NO]: TOO_LONG, [NAME]: TOO_LONG });
    act(() => store().clearFieldError(SCOPE, REFERENCE_NO));

    expect(store().errors[SCOPE]).toEqual({ [NAME]: TOO_LONG });
  });

  it.each([
    ["a field without error", SCOPE],
    ["a scope without errors", OTHER_SCOPE],
  ])("does not change the state when clearing %s", (_case, scope) => {
    setErrors({ [NAME]: TOO_LONG });
    const before = store().errors;
    act(() => store().clearFieldError(scope, REFERENCE_NO));

    expect(store().errors).toBe(before);
  });

  it("clears a scope, and does nothing for a scope without errors", () => {
    setErrors({ [NAME]: TOO_LONG });
    const before = store().errors;
    act(() => store().clearScope(OTHER_SCOPE));
    expect(store().errors).toBe(before);

    act(() => store().clearScope(SCOPE));
    expect(store().errors).toEqual({});
  });

  it("exposes the error of a field through the hook", () => {
    const { result } = renderHook(() => useServerFieldError(SCOPE, REFERENCE_NO));
    expect(result.current).toBeUndefined();

    setErrors({ [REFERENCE_NO]: TOO_LONG });
    expect(result.current).toBe(TOO_LONG);
  });
});

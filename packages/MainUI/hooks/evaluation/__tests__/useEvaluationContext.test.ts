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

import { renderHook } from "@testing-library/react";
import { createSmartContext } from "@/utils/expressions";
import { logger } from "@/utils/logger";
import { useEvaluationContext } from "../useEvaluationContext";

jest.mock("@/utils/expressions", () => {
  const actual = jest.requireActual("@/utils/expressions");
  return { ...actual, createSmartContext: jest.fn(actual.createSmartContext) };
});
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn() } }));

const mockedCreate = createSmartContext as jest.Mock;

describe("useEvaluationContext", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds through createSmartContext with the given options", () => {
    const values = { docStatus: "CO" };
    const { result } = renderHook(() => useEvaluationContext({ values, windowId: "W1" }));
    expect(result.current?.DOCSTATUS).toBe("CO");
    expect(mockedCreate).toHaveBeenCalledWith(expect.objectContaining({ values, windowId: "W1" }));
  });

  it("reuses the context while the inputs are the same objects", () => {
    const values = { a: "1" };
    const { result, rerender } = renderHook(() => useEvaluationContext({ values }));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    expect(mockedCreate).toHaveBeenCalledTimes(1);
  });

  it("returns null and logs instead of throwing when the build throws", () => {
    mockedCreate.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { result } = renderHook(() => useEvaluationContext({ values: { a: "1" } }));
    expect(result.current).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.any(String), expect.any(Error));
  });

  it("rebuilds when an input changes identity", () => {
    const { result, rerender } = renderHook(({ values }) => useEvaluationContext({ values }), {
      initialProps: { values: { docStatus: "DR" } },
    });
    rerender({ values: { docStatus: "CO" } });
    expect(mockedCreate).toHaveBeenCalledTimes(2);
    expect(result.current?.DOCSTATUS).toBe("CO");
  });
});

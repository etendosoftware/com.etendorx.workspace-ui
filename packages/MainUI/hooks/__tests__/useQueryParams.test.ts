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

import { renderHook } from "@testing-library/react";
import { useQueryParams } from "../useQueryParams";
import { useSearchParams } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

describe("useQueryParams", () => {
  it("should return an empty object when no search params are present", () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    const { result } = renderHook(() => useQueryParams());
    expect(result.current).toEqual({});
  });

  it("should return an object with the current search params", () => {
    const params = new URLSearchParams({
      id: "123",
      name: "john",
    });
    (useSearchParams as jest.Mock).mockReturnValue(params);
    const { result } = renderHook(() => useQueryParams());
    expect(result.current).toEqual({
      id: "123",
      name: "john",
    });
  });

  it("should memoize the result", () => {
    const params = new URLSearchParams({ id: "123" });
    (useSearchParams as jest.Mock).mockReturnValue(params);
    const { result, rerender } = renderHook(() => useQueryParams());
    const firstResult = result.current;
    
    rerender();
    
    expect(result.current).toBe(firstResult);
  });
});

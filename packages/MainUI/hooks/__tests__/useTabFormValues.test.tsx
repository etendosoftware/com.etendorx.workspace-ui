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

import { act, renderHook } from "@testing-library/react";
import { createFormValuesStore, type FormValuesStore } from "@/contexts/tabFormValuesStore";
import { useTabFormValues } from "../useTabFormValues";

let mockStore: FormValuesStore | undefined;
jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({ formValuesStore: mockStore }),
}));

const renderCounting = (names: string[]) => {
  let renders = 0;
  const hook = renderHook(() => {
    renders++;
    return useTabFormValues(names);
  });
  return { hook, renders: () => renders };
};

describe("useTabFormValues", () => {
  beforeEach(() => {
    mockStore = createFormValuesStore();
  });

  it("returns the current values", () => {
    mockStore?.set({ a: 1, b: 2 });
    const { hook } = renderCounting(["a"]);
    expect(hook.result.current).toEqual({ a: 1, b: 2 });
  });

  it("re-renders with the latest values when a watched name changes", () => {
    const { hook, renders } = renderCounting(["a"]);
    act(() => mockStore?.set({ a: 1, b: 2 }));
    expect(hook.result.current).toEqual({ a: 1, b: 2 });
    expect(renders()).toBe(2);
  });

  it("does not re-render when only unwatched names change", () => {
    mockStore?.set({ a: 1 });
    const { hook, renders } = renderCounting(["a"]);
    act(() => mockStore?.set((prev) => ({ ...prev, b: 2 })));
    act(() => mockStore?.set((prev) => ({ ...prev, b: 3 })));
    expect(renders()).toBe(1);
    expect(hook.result.current).toEqual({ a: 1 });
  });

  it("re-renders when the values are reset to empty", () => {
    mockStore?.set({ b: 2 });
    const { hook, renders } = renderCounting(["a"]);
    act(() => mockStore?.set({}));
    expect(renders()).toBe(2);
    expect(hook.result.current).toEqual({});
  });

  it("picks up values written before a name was watched", () => {
    let renders = 0;
    const hook = renderHook(
      ({ names }: { names: string[] }) => {
        renders++;
        return useTabFormValues(names);
      },
      { initialProps: { names: [] as string[] } }
    );
    act(() => mockStore?.set({ a: 1 }));
    expect(renders).toBe(1);

    hook.rerender({ names: ["a"] });

    expect(hook.result.current).toEqual({ a: 1 });
  });

  it("does not re-render when empty values are replaced by empty values", () => {
    const { renders } = renderCounting(["a"]);
    act(() => mockStore?.set({}));
    expect(renders()).toBe(1);
  });

  it("returns an empty object when the tab has no store", () => {
    mockStore = undefined;
    const { hook } = renderCounting(["a"]);
    expect(hook.result.current).toEqual({});
  });
});

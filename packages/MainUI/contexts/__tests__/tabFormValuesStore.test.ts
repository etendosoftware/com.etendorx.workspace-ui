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

import { createFormValuesStore } from "../tabFormValuesStore";

describe("createFormValuesStore", () => {
  it("starts empty and replaces the values with set(value)", () => {
    const store = createFormValuesStore();
    expect(store.get()).toEqual({});
    store.set({ a: 1 });
    expect(store.get()).toEqual({ a: 1 });
  });

  it("applies set(updater) to the current values", () => {
    const store = createFormValuesStore();
    store.set({ a: 1 });
    store.set((prev) => ({ ...prev, b: 2 }));
    expect(store.get()).toEqual({ a: 1, b: 2 });
  });

  it("keeps the same snapshot until the next set", () => {
    const store = createFormValuesStore();
    store.set({ a: 1 });
    expect(store.get()).toBe(store.get());
  });

  it("notifies subscribers on set and stops after unsubscribe", () => {
    const store = createFormValuesStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    store.set({ a: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set({ a: 2 });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify when an updater returns the same object", () => {
    const store = createFormValuesStore();
    const listener = jest.fn();
    store.subscribe(listener);
    store.set((prev) => prev);
    expect(listener).not.toHaveBeenCalled();
  });
});

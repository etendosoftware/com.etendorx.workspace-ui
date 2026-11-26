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

import { getTabCountKey, useTabCountsStore } from "@/stores/tabCountsStore";

const KEY = getTabCountKey("143_1000", "tab1");
const state = () => useTabCountsStore.getState();

describe("tabCountsStore", () => {
  beforeEach(() => useTabCountsStore.setState({ counts: {}, partial: {} }));

  it("stores an exact count", () => {
    state().setCount(KEY, 119);

    expect(state().counts[KEY]).toBe(119);
    expect(state().partial[KEY]).toBeUndefined();
  });

  it("marks a count as partial while more records exist, and unmarks it once they are loaded", () => {
    state().setCount(KEY, 101, true);
    expect(state().partial[KEY]).toBe(true);

    state().setCount(KEY, 119, false);
    expect(state().counts[KEY]).toBe(119);
    expect(state().partial[KEY]).toBeUndefined();
  });

  it("keeps the same state when nothing changed", () => {
    state().setCount(KEY, 101, true);
    const before = state();

    state().setCount(KEY, 101, true);

    expect(state()).toBe(before);
  });

  it("updates the state when only the partial mark changes", () => {
    state().setCount(KEY, 101, true);

    state().setCount(KEY, 101, false);

    expect(state().partial[KEY]).toBeUndefined();
  });

  it("clears the count and its partial mark", () => {
    state().setCount(KEY, 101, true);

    state().clearCount(KEY);

    expect(state().counts[KEY]).toBeUndefined();
    expect(state().partial[KEY]).toBeUndefined();
  });

  it("ignores clearing a key without count", () => {
    const before = state();

    state().clearCount(KEY);

    expect(state()).toBe(before);
  });
});

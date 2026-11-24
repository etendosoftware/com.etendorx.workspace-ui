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
import { useTabRecordCount } from "@/hooks/table/useTabRecordCount";
import { useTabCountsStore } from "@/stores/tabCountsStore";

const KEY = "143_1000:tab1";
const BASE = {
  tabCountKey: KEY,
  isChildTab: true,
  hasMultipleParents: false,
  isLoading: false,
  loadedRecordsCount: 101,
};
const state = () => useTabCountsStore.getState();

describe("useTabRecordCount", () => {
  beforeEach(() => useTabCountsStore.setState({ counts: {}, partial: {} }));

  it("publishes the loaded count of a child tab as exact by default", () => {
    renderHook(() => useTabRecordCount(BASE));

    expect(state().counts[KEY]).toBe(101);
    expect(state().partial[KEY]).toBeUndefined();
  });

  it("publishes the count as partial while more records exist", () => {
    renderHook(() => useTabRecordCount({ ...BASE, hasMoreRecords: true }));

    expect(state().partial[KEY]).toBe(true);
  });

  it("publishes nothing for a root tab or while loading", () => {
    renderHook(() => useTabRecordCount({ ...BASE, isChildTab: false }));
    renderHook(() => useTabRecordCount({ ...BASE, isLoading: true }));

    expect(state().counts[KEY]).toBeUndefined();
  });

  it("clears the count while several parent records are selected", () => {
    state().setCount(KEY, 5, true);

    renderHook(() => useTabRecordCount({ ...BASE, hasMultipleParents: true }));

    expect(state().counts[KEY]).toBeUndefined();
    expect(state().partial[KEY]).toBeUndefined();
  });
});

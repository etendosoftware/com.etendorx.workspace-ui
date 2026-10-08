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
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import { SELECTION_SETTLE_MS } from "@/hooks/useSettledValue";
import { useSettledParent } from "../useSettledParent";

type Props = { parentRecord?: EntityData | null; parentIdFromUrl?: string };

const record = (id: string, extra: Record<string, unknown> = {}) => ({ id, ...extra }) as EntityData;

const setup = (initial: Props) => renderHook((props: Props) => useSettledParent(props), { initialProps: initial });

describe("useSettledParent", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the parent id and record as they are for an isolated change", () => {
    const { result, rerender } = setup({ parentRecord: record("P1") });
    expect(result.current).toEqual({ parentId: "P1", parentRecord: record("P1"), isPending: false });
    act(() => jest.advanceTimersByTime(SELECTION_SETTLE_MS));
    rerender({ parentRecord: record("P2") });
    expect(result.current.parentId).toBe("P2");
  });

  it("falls back to the parent id from the URL", () => {
    const { result } = setup({ parentRecord: null, parentIdFromUrl: "P9" });
    expect(result.current).toEqual({ parentId: "P9", parentRecord: null, isPending: false });
  });

  it("keeps the first parent of a fast burst until the last one settles", () => {
    const { result, rerender } = setup({ parentRecord: record("P1") });
    act(() => jest.advanceTimersByTime(SELECTION_SETTLE_MS));
    rerender({ parentRecord: record("P2") });
    act(() => jest.advanceTimersByTime(100));
    rerender({ parentRecord: record("P3") });
    act(() => jest.advanceTimersByTime(100));
    rerender({ parentRecord: record("P4") });

    expect(result.current).toEqual({ parentId: "P2", parentRecord: record("P2"), isPending: true });

    act(() => jest.advanceTimersByTime(SELECTION_SETTLE_MS));
    expect(result.current).toEqual({ parentId: "P4", parentRecord: record("P4"), isPending: false });
  });

  it("passes a refreshed record of the same parent straight through", () => {
    const { result, rerender } = setup({ parentRecord: record("P1", { docStatus: "DR" }) });
    rerender({ parentRecord: record("P1", { docStatus: "CO" }) });
    expect(result.current.parentRecord).toEqual(record("P1", { docStatus: "CO" }));
  });

  it("keeps the held parent's record when a burst ends with no parent", () => {
    const { result, rerender } = setup({ parentRecord: record("P1") });
    act(() => jest.advanceTimersByTime(SELECTION_SETTLE_MS));
    rerender({ parentRecord: record("P2") });
    act(() => jest.advanceTimersByTime(100));
    rerender({ parentRecord: null });
    expect(result.current).toEqual({ parentId: "P2", parentRecord: record("P2"), isPending: true });

    act(() => jest.advanceTimersByTime(SELECTION_SETTLE_MS));
    expect(result.current).toEqual({ parentId: "", parentRecord: null, isPending: false });
  });

  it("returns an empty id when nothing is selected", () => {
    const { result } = setup({ parentRecord: null });
    expect(result.current).toEqual({ parentId: "", parentRecord: null, isPending: false });
  });
});

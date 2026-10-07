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
import { useAlertCount } from "../useAlertCount";
import { fetchAlertCount } from "@/utils/alerts/fetchAlertCount";
import { ALERTS_POLL_DELAY_MS } from "@/utils/alerts/constants";

jest.mock("@/utils/alerts/fetchAlertCount", () => ({
  fetchAlertCount: jest.fn(),
}));

const mockFetchAlertCount = fetchAlertCount as jest.Mock;

/** Flushes the pending fetch promise so the hook can store the count and reschedule. */
const flushPoll = () => act(async () => {});

/** Advances to the next poll and flushes its response. */
const advanceToNextPoll = async () => {
  await act(async () => {
    jest.advanceTimersByTime(ALERTS_POLL_DELAY_MS);
  });
  await flushPoll();
};

const renderAlertCount = (enabled = true, roleId = "role-1") =>
  renderHook(({ enabled, roleId }) => useAlertCount(enabled, roleId), { initialProps: { enabled, roleId } });

describe("useAlertCount", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchAlertCount.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null until the first response and then the fetched count", async () => {
    mockFetchAlertCount.mockResolvedValue(1);

    const { result } = renderAlertCount();
    expect(result.current).toBeNull();

    await flushPoll();
    expect(result.current).toBe(1);
    expect(mockFetchAlertCount).toHaveBeenCalledTimes(1);
  });

  it("polls again after the classic delay", async () => {
    mockFetchAlertCount.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    const { result } = renderAlertCount();
    await flushPoll();
    await advanceToNextPoll();

    expect(mockFetchAlertCount).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(2);
  });

  it("keeps the last count and keeps polling after a failed poll", async () => {
    mockFetchAlertCount.mockResolvedValueOnce(1).mockResolvedValueOnce(null).mockResolvedValueOnce(0);

    const { result } = renderAlertCount();
    await flushPoll();
    await advanceToNextPoll();
    expect(result.current).toBe(1);

    await advanceToNextPoll();
    expect(result.current).toBe(0);
    expect(mockFetchAlertCount).toHaveBeenCalledTimes(3);
  });

  it("does not poll while disabled", async () => {
    renderAlertCount(false);
    await advanceToNextPoll();

    expect(mockFetchAlertCount).not.toHaveBeenCalled();
  });

  it("stops polling when unmounted", async () => {
    mockFetchAlertCount.mockResolvedValue(1);

    const { unmount } = renderAlertCount();
    await flushPoll();
    unmount();
    await advanceToNextPoll();

    expect(mockFetchAlertCount).toHaveBeenCalledTimes(1);
  });

  it("ignores a response that arrives after unmount", async () => {
    let resolvePoll: (value: number) => void = () => {};
    mockFetchAlertCount.mockReturnValue(new Promise((resolve) => (resolvePoll = resolve)));

    const { unmount } = renderAlertCount();
    unmount();
    await act(async () => resolvePoll(5));
    await advanceToNextPoll();

    expect(mockFetchAlertCount).toHaveBeenCalledTimes(1);
  });

  it("polls immediately when the role changes", async () => {
    mockFetchAlertCount.mockResolvedValue(1);

    const { rerender } = renderAlertCount();
    await flushPoll();
    rerender({ enabled: true, roleId: "role-2" });
    await flushPoll();

    expect(mockFetchAlertCount).toHaveBeenCalledTimes(2);
  });
});

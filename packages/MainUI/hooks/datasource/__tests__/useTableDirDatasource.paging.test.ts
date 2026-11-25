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
import { useFormContext } from "react-hook-form";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useTabContext } from "@/contexts/tab";
import { runPendingSearch, useTableDirDatasource } from "../useTableDirDatasource";

jest.mock("@/contexts/tab");
jest.mock("react-hook-form");
jest.mock("@/hooks/useFormParent", () => ({ __esModule: true, default: jest.fn(() => ({})) }));
jest.mock("@/hooks/useUserContext", () => ({ useUserContext: jest.fn(() => ({ currentWarehouse: null })) }));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { client: { post: jest.fn() } },
}));
jest.mock("@/utils/logger");

const PAGE_SIZE = 2;
const FIELD = {
  id: "FIELD-1",
  hqlName: "businessPartner",
  columnName: "c_bpartner_id",
  name: "Business Partner",
  selector: { datasourceName: "ComboTableDatasourceService" },
} as unknown as Field;

/** A datasource answer with these option ids; `startRow` only when the server reports one. */
const answer = (ids: string[], startRow?: number) => ({
  data: { response: { data: ids.map((id) => ({ id, _identifier: id })), startRow } },
});
const lastRange = () => {
  const { params } = (datasource.client.post as jest.Mock).mock.calls.at(-1)[1];
  return { startRow: params._startRow, endRow: params._endRow };
};
const optionIds = (records: Array<Record<string, string>>) => records.map((record) => record.id);

/** Opens the combo (first page) with the given answers queued, one per request. */
const openCombo = async (...answers: unknown[]) => {
  for (const response of answers) {
    (datasource.client.post as jest.Mock).mockResolvedValueOnce(response);
  }
  const hook = renderHook(() =>
    useTableDirDatasource({ field: FIELD, pageSize: PAGE_SIZE, initialPageSize: PAGE_SIZE })
  );
  await act(async () => hook.result.current.refetch());
  return hook;
};
const loadMore = async (result: { current: ReturnType<typeof useTableDirDatasource> }) => {
  await act(async () => result.current.loadMore());
};

describe("useTableDirDatasource — paging (ETP-6303)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: null, parentTab: null, parentRecord: null });
    (useFormContext as jest.Mock).mockReturnValue({ watch: jest.fn(), getValues: jest.fn(() => ({})) });
  });

  it("asks for the next options right after the last loaded one, not for the first page again", async () => {
    // Classic reads `_endRow` as inclusive: the first page holds rows 0..2
    const { result } = await openCombo(answer(["1", "2", "3"]), answer(["4", "5", "6"]), answer(["7"]));
    expect(lastRange()).toEqual({ startRow: "0", endRow: String(PAGE_SIZE) });

    await loadMore(result);
    expect(lastRange()).toEqual({ startRow: "3", endRow: String(3 + PAGE_SIZE) });

    await loadMore(result);
    expect(lastRange().startRow).toBe("6");
    expect(optionIds(result.current.records)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("stops loading when the server answers the first rows again", async () => {
    const { result } = await openCombo(answer(["1", "2", "3"]), answer(["1", "2", "3"], 0));

    await loadMore(result);

    expect(result.current.hasMore).toBe(false);
    expect(optionIds(result.current.records)).toEqual(["1", "2", "3"]);
  });

  it("starts from the first row again when the combo is reopened", async () => {
    const { result } = await openCombo(answer(["1", "2", "3"]), answer(["4", "5", "6"]), answer(["1", "2", "3"]));
    await loadMore(result);

    await act(async () => result.current.refetch());

    expect(lastRange().startRow).toBe("0");
    expect(optionIds(result.current.records)).toEqual(["1", "2", "3"]);
  });
});

describe("useTableDirDatasource — search typed during a load (ETP-6431)", () => {
  const SEARCH_TERM = "alpha";
  const postedBodies = () => (datasource.client.post as jest.Mock).mock.calls.map(([, body]) => JSON.stringify(body));

  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: null, parentTab: null, parentRecord: null });
    (useFormContext as jest.Mock).mockReturnValue({ watch: jest.fn(), getValues: jest.fn(() => ({})) });
  });

  it("runs the search once the running load ends, instead of dropping it", async () => {
    let finishFirstLoad: (value: unknown) => void = () => undefined;
    const firstLoad = new Promise((resolve) => {
      finishFirstLoad = resolve;
    });
    (datasource.client.post as jest.Mock).mockReturnValueOnce(firstLoad).mockResolvedValueOnce(answer(["A"]));
    const { result } = renderHook(() =>
      useTableDirDatasource({ field: FIELD, pageSize: PAGE_SIZE, initialPageSize: PAGE_SIZE })
    );

    let refetching: Promise<void> = Promise.resolve();
    act(() => {
      refetching = result.current.refetch();
    });
    act(() => result.current.search(SEARCH_TERM));
    expect(datasource.client.post).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishFirstLoad(answer(["1", "2", "3"]));
      await refetching;
    });

    expect(datasource.client.post).toHaveBeenCalledTimes(2);
    expect(postedBodies()[1]).toContain(SEARCH_TERM);
    expect(optionIds(result.current.records)).toEqual(["A"]);
    expect(result.current.loading).toBe(false);
  });

  it("runs a pending search only once and forgets it", () => {
    const fetch = jest.fn(() => Promise.resolve());
    const pendingSearchRef = { current: { value: "V", term: SEARCH_TERM } };

    runPendingSearch(pendingSearchRef, fetch);
    runPendingSearch(pendingSearchRef, fetch);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("V", true, SEARCH_TERM);
    expect(pendingSearchRef.current).toBeNull();
  });

  it("does nothing without a pending search", () => {
    const fetch = jest.fn(() => Promise.resolve());

    runPendingSearch({ current: null }, fetch);

    expect(fetch).not.toHaveBeenCalled();
  });
});

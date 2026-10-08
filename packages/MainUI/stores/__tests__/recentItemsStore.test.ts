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

import { useRecentItemsStore } from "@/stores/recentItemsStore";
import { fetchRecentItems, saveRecentItems } from "@workspaceui/api-client/src/api/recentItems";
import { DEFAULT_RECENT_LIST_SIZE } from "@/utils/recentItems";
import { logger } from "@/utils/logger";
import {
  buildRecentItem,
  installMemoryLocalStorage,
  OTHER_SCOPE_KEY,
  readRecentItemsCache,
  SCOPE_KEY,
  seedRecentItemsCache,
} from "@/test-utils/recentItems";

jest.mock("@workspaceui/api-client/src/api/recentItems", () => ({
  fetchRecentItems: jest.fn(),
  saveRecentItems: jest.fn(),
}));

const mockedFetch = fetchRecentItems as jest.Mock;
const mockedSave = saveRecentItems as jest.Mock;

const [itemA, itemB, itemC] = ["a", "b", "c"].map((id) => buildRecentItem(id));

const getState = () => useRecentItemsStore.getState();

/** Returns a promise plus the function that resolves it, to control when a request finishes. */
const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe("recentItemsStore", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    mockedFetch.mockReset();
    mockedSave.mockReset();
    jest.spyOn(logger, "warn").mockImplementation(() => undefined);
    useRecentItemsStore.setState({ scopeKey: "", items: [], size: DEFAULT_RECENT_LIST_SIZE });
  });

  describe("loadForScope", () => {
    it("replaces the cached items with the server list and size", async () => {
      seedRecentItemsCache([itemC]);
      mockedFetch.mockResolvedValue({ items: [itemA, itemB], size: 2 });

      await getState().loadForScope(SCOPE_KEY);

      expect(getState()).toMatchObject({ scopeKey: SCOPE_KEY, items: [itemA, itemB], size: 2 });
      expect(readRecentItemsCache()[SCOPE_KEY]).toEqual([itemA, itemB]);
    });

    it("keeps the cached items when the server is not available", async () => {
      seedRecentItemsCache([itemC]);
      mockedFetch.mockRejectedValue(new Error("network error"));

      await getState().loadForScope(SCOPE_KEY);

      expect(getState().items).toEqual([itemC]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it("clears the items without calling the server for an empty scope", async () => {
      useRecentItemsStore.setState({ items: [itemA] });

      await getState().loadForScope("");

      expect(getState().items).toEqual([]);
      expect(mockedFetch).not.toHaveBeenCalled();
    });

    it("ignores a stale response when the scope changed meanwhile", async () => {
      const first = deferred<unknown>();
      mockedFetch.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ items: [itemB], size: 3 });

      const firstLoad = getState().loadForScope(SCOPE_KEY);
      await getState().loadForScope(OTHER_SCOPE_KEY);
      first.resolve({ items: [itemA], size: 3 });
      await firstLoad;

      expect(getState()).toMatchObject({ scopeKey: OTHER_SCOPE_KEY, items: [itemB] });
    });

    it("keeps the server response when only a local update happened meanwhile", async () => {
      const pending = deferred<unknown>();
      mockedFetch.mockReturnValueOnce(pending.promise);

      const load = getState().loadForScope(SCOPE_KEY);
      getState().setItems([itemC]);
      pending.resolve({ items: [itemA], size: 3 });
      await load;

      expect(getState().items).toEqual([itemA]);
    });
  });

  describe("add", () => {
    beforeEach(() => {
      useRecentItemsStore.setState({ scopeKey: SCOPE_KEY, items: [itemA, itemB], size: 2 });
    });

    it("saves the list with the new item first, trimmed to the configured size", async () => {
      mockedSave.mockResolvedValue({ items: [itemC, itemA], size: 2 });

      await getState().add(itemC);

      expect(mockedSave).toHaveBeenCalledWith([itemC, itemA]);
      expect(getState().items).toEqual([itemC, itemA]);
      expect(readRecentItemsCache()[SCOPE_KEY]).toEqual([itemC, itemA]);
    });

    it("applies the size returned by the server", async () => {
      mockedSave.mockResolvedValue({ items: [itemC], size: 1 });

      await getState().add(itemC);

      expect(getState()).toMatchObject({ items: [itemC], size: 1 });
    });

    it("keeps the optimistic list in the local cache when saving fails", async () => {
      mockedSave.mockRejectedValue(new Error("network error"));

      await getState().add(itemC);

      expect(getState().items).toEqual([itemC, itemA]);
      expect(readRecentItemsCache()[SCOPE_KEY]).toEqual([itemC, itemA]);
      expect(logger.warn).toHaveBeenCalled();
    });

    it("does not save when the item is already the newest one", async () => {
      await getState().add(itemA);

      expect(mockedSave).not.toHaveBeenCalled();
    });

    it("does nothing while the scope is unknown", async () => {
      useRecentItemsStore.setState({ scopeKey: "" });

      await getState().add(itemC);

      expect(mockedSave).not.toHaveBeenCalled();
      expect(getState().items).toEqual([itemA, itemB]);
    });

    it("ignores the response of an older save when a newer one was made", async () => {
      const first = deferred<unknown>();
      mockedSave.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ items: [itemB, itemC], size: 2 });

      const firstAdd = getState().add(itemC);
      await getState().add(itemB);
      first.resolve({ items: [itemC, itemA], size: 2 });
      await firstAdd;

      expect(getState().items).toEqual([itemB, itemC]);
    });
  });
});

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

import {
  buildRecentItemsScopeKey,
  readCachedRecentItems,
  RECENT_ITEMS_STORAGE_KEY,
  trimRecentItems,
  upsertRecentItem,
  writeCachedRecentItems,
} from "@/utils/recentItems";
import { logger } from "@/utils/logger";
import {
  buildRecentItem,
  installMemoryLocalStorage,
  ORG_ID,
  OTHER_SCOPE_KEY,
  readRecentItemsCache,
  ROLE_ID,
  SCOPE_KEY,
  seedRecentItemsCache,
  USER_ID,
} from "@/test-utils/recentItems";

const [itemA, itemB, itemC] = ["a", "b", "c"].map((id) => buildRecentItem(id));

describe("utils/recentItems", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    installMemoryLocalStorage();
  });

  describe("buildRecentItemsScopeKey", () => {
    it("joins user, role and organization", () => {
      expect(buildRecentItemsScopeKey(USER_ID, ROLE_ID, ORG_ID)).toBe(`${USER_ID}|${ROLE_ID}|${ORG_ID}`);
    });

    it.each([
      [undefined, ROLE_ID, ORG_ID],
      [USER_ID, undefined, ORG_ID],
      [USER_ID, ROLE_ID, undefined],
    ])("returns an empty key while part of the session is unknown (%s, %s, %s)", (userId, roleId, orgId) => {
      expect(buildRecentItemsScopeKey(userId, roleId, orgId)).toBe("");
    });
  });

  describe("trimRecentItems / upsertRecentItem", () => {
    it("keeps only the newest items", () => {
      expect(trimRecentItems([itemA, itemB, itemC], 2)).toEqual([itemA, itemB]);
    });

    it("prepends a new item and discards the oldest beyond the size", () => {
      expect(upsertRecentItem([itemA, itemB], itemC, 2)).toEqual([itemC, itemA]);
    });

    it("moves an existing item to the front replacing the stale entry", () => {
      const renamedB = { ...itemB, name: "Renamed" };
      expect(upsertRecentItem([itemA, itemB, itemC], renamedB, 3)).toEqual([renamedB, itemA, itemC]);
    });
  });

  describe("local cache", () => {
    it("writes and reads the items of a scope without touching other scopes", () => {
      seedRecentItemsCache([itemC], OTHER_SCOPE_KEY);

      writeCachedRecentItems(SCOPE_KEY, [itemA]);

      expect(readCachedRecentItems(SCOPE_KEY)).toEqual([itemA]);
      expect(readRecentItemsCache()[OTHER_SCOPE_KEY]).toEqual([itemC]);
    });

    it("returns an empty list for an empty scope or a scope without items", () => {
      seedRecentItemsCache([itemA]);
      expect(readCachedRecentItems("")).toEqual([]);
      expect(readCachedRecentItems("missing")).toEqual([]);
    });

    it("ignores writes for an empty scope", () => {
      writeCachedRecentItems("", [itemA]);
      expect(window.localStorage.getItem(RECENT_ITEMS_STORAGE_KEY)).toBeNull();
    });

    it("returns an empty list when the cache is corrupted", () => {
      const warn = jest.spyOn(logger, "warn").mockImplementation(() => undefined);
      window.localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, "{not-json");

      expect(readCachedRecentItems(SCOPE_KEY)).toEqual([]);
      expect(warn).toHaveBeenCalled();
    });

    it("logs instead of throwing when the cache cannot be written", () => {
      const warn = jest.spyOn(logger, "warn").mockImplementation(() => undefined);
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error("quota exceeded");
      });

      expect(() => writeCachedRecentItems(SCOPE_KEY, [itemA])).not.toThrow();
      expect(warn).toHaveBeenCalled();
    });
  });
});

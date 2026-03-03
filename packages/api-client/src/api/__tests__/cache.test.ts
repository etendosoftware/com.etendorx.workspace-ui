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

/**
 * @jest-environment jsdom
 */

import { CacheStore } from "../cache";

describe("api/cache/CacheStore", () => {
  const prefix = "test_";
  const duration = 1000; // 1 second
  let cache: CacheStore;

  beforeEach(() => {
    localStorage.clear();
    cache = new CacheStore(duration, prefix);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("throws error if duration is not positive", () => {
    expect(() => new CacheStore(0)).toThrow("Duration must be a positive number.");
    expect(() => new CacheStore(-1)).toThrow("Duration must be a positive number.");
  });

  it("stores and retrieves a value", () => {
    const value = { data: "test" };
    cache.set("key", value);
    expect(cache.get("key")).toEqual(value);
  });

  it("returns null for non-existent key", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("returns null and deletes item if expired", () => {
    const value = "expired_value";
    cache.set("key", value);

    // Advance time beyond duration
    jest.advanceTimersByTime(duration + 1);

    expect(cache.get("key")).toBeNull();
    expect(localStorage.getItem(`${prefix}key`)).toBeNull();
  });

  it("deletes an item", () => {
    cache.set("key", "value");
    cache.delete("key");
    expect(cache.get("key")).toBeNull();
  });

  it("clears all items with matching prefix", () => {
    cache.set("key1", "val1");
    cache.set("key2", "val2");
    localStorage.setItem("other", "keep");

    cache.clear();

    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBeNull();
    expect(localStorage.getItem("other")).toBe("keep");
  });

  it("handles parse error gracefully", () => {
    localStorage.setItem(`${prefix}bad`, "invalid json");
    const spy = jest.spyOn(console, "warn").mockImplementation();

    expect(cache.get("bad")).toBeNull();
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it("handles storage quota error", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    cache.set("key", "value");

    expect(spy).toHaveBeenCalledWith("Storage quota exceeded.");

    setItemSpy.mockRestore();
    spy.mockRestore();
  });
});

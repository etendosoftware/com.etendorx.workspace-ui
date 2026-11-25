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

import { createPreloadCache, PRELOAD_MAX_AGE_MS } from "../preload";

const WINDOW_ID = "143";
const ANSWER = "settings";

describe("createPreloadCache", () => {
  let clock = 0;
  const request = jest.fn(() => Promise.resolve(ANSWER));
  const newCache = () => createPreloadCache<string>(() => clock);

  beforeEach(() => {
    clock = 0;
    request.mockClear();
  });

  it("gives the request of a hovered window to its next opening, once", async () => {
    const cache = newCache();
    cache.preload(WINDOW_ID, request);

    await expect(cache.take(WINDOW_ID)).resolves.toBe(ANSWER);
    expect(cache.take(WINDOW_ID)).toBeUndefined();
  });

  it("does not ask again while a recent request of the window is there", () => {
    const cache = newCache();
    cache.preload(WINDOW_ID, request);
    clock = PRELOAD_MAX_AGE_MS;
    cache.preload(WINDOW_ID, request);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("leaves an old request for the opening to ask again, and asks again on the next hover", () => {
    const cache = newCache();
    cache.preload(WINDOW_ID, request);
    clock = PRELOAD_MAX_AGE_MS + 1;

    expect(cache.take(WINDOW_ID)).toBeUndefined();
    cache.preload(WINDOW_ID, request);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("forgets every request when cleared", () => {
    const cache = newCache();
    cache.preload(WINDOW_ID, request);

    cache.clear();

    expect(cache.take(WINDOW_ID)).toBeUndefined();
  });
});

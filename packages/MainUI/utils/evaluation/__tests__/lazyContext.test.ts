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

import { lazyContext, lazyContextByKey } from "../lazyContext";

describe("lazyContext", () => {
  it("builds on first call and reuses the result", () => {
    const build = jest.fn(() => ({ a: 1 }));
    const get = lazyContext(build);
    expect(build).not.toHaveBeenCalled();
    expect(get()).toBe(get());
    expect(build).toHaveBeenCalledTimes(1);
  });

  it("does not cache a build that throws", () => {
    const build = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("boom");
      })
      .mockReturnValue({ a: 1 });
    const get = lazyContext(build);
    expect(() => get()).toThrow("boom");
    expect(get()).toEqual({ a: 1 });
    expect(build).toHaveBeenCalledTimes(2);
  });
});

describe("lazyContextByKey", () => {
  it("builds once per key, lazily", () => {
    const recordA = { id: "A" };
    const recordB = { id: "B" };
    const build = jest.fn((record: { id: string }) => ({ id: record.id }));
    const get = lazyContextByKey(build);
    expect(get(recordA)).toBe(get(recordA));
    get(recordB);
    expect(build).toHaveBeenCalledTimes(2);
  });

  it("does not cache a build that throws", () => {
    const record = { id: "A" };
    const build = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("boom");
      })
      .mockReturnValue({ ok: true });
    const get = lazyContextByKey(build);
    expect(() => get(record)).toThrow("boom");
    expect(get(record)).toEqual({ ok: true });
    expect(build).toHaveBeenCalledTimes(2);
  });
});

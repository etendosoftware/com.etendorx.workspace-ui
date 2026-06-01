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

import { ACTION_EXECUTE_JSON_DEFERRED, createAction } from "../action";

const ACTION_NAME = "myAction";

describe("createAction", () => {
  it("registers an action and executes it with params", () => {
    const action = createAction();
    const fn = jest.fn((params) => `ran:${(params as { x: number }).x}`);
    expect(action.set(ACTION_NAME, fn)).toBe(true);

    const result = action.execute(ACTION_NAME, { x: 5 });
    expect(fn).toHaveBeenCalledWith({ x: 5 });
    expect(result).toBe("ran:5");
  });

  it("overwrites an action registered under the same name", () => {
    const action = createAction();
    const first = jest.fn();
    const second = jest.fn(() => "second");
    action.set(ACTION_NAME, first);
    action.set(ACTION_NAME, second);

    expect(action.execute(ACTION_NAME)).toBe("second");
    expect(first).not.toHaveBeenCalled();
  });

  it("returns false when executing an unregistered action", () => {
    expect(createAction().execute("unknown")).toBe(false);
  });

  it("defers execution by the given delay", () => {
    jest.useFakeTimers();
    try {
      const action = createAction();
      const fn = jest.fn();
      action.set(ACTION_NAME, fn);

      action.execute(ACTION_NAME, { v: 1 }, 1000);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledWith({ v: 1 });
    } finally {
      jest.useRealTimers();
    }
  });

  it("throws from the deferred executeJSON stub", () => {
    expect(() => createAction().executeJSON()).toThrow(ACTION_EXECUTE_JSON_DEFERRED);
  });
});

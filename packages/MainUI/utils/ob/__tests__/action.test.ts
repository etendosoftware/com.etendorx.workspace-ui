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

import { createAction } from "../action";

const ACTION_NAME = "myAction";
const BUILTIN_NAME = "refreshGrid";

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

  describe("executeJSON", () => {
    it("runs a registered action for a matching entry (registry-first)", () => {
      const action = createAction();
      const fn = jest.fn();
      action.set(ACTION_NAME, fn);

      expect(action.executeJSON([{ [ACTION_NAME]: { x: 1 } }])).toBe(true);
      expect(fn).toHaveBeenCalledWith({ x: 1 });
    });

    it("normalizes a single object argument into a one-entry array", () => {
      const action = createAction();
      const fn = jest.fn();
      action.set(ACTION_NAME, fn);

      action.executeJSON({ [ACTION_NAME]: { y: 2 } });
      expect(fn).toHaveBeenCalledWith({ y: 2 });
    });

    it("routes a built-in (unregistered) entry to dispatchBuiltinAction", () => {
      const dispatchBuiltinAction = jest.fn(() => true);
      const action = createAction({ dispatchBuiltinAction });

      action.executeJSON([{ [BUILTIN_NAME]: { foo: "bar" } }]);
      expect(dispatchBuiltinAction).toHaveBeenCalledWith(BUILTIN_NAME, { foo: "bar" });
    });

    it("invokes the built-in custom action's function form", () => {
      const action = createAction();
      const func = jest.fn();

      action.executeJSON([{ custom: { func, text: "hi" } }]);
      expect(func).toHaveBeenCalledWith({ func, text: "hi" });
    });

    it("dispatches multiple entries in order", () => {
      const dispatchBuiltinAction = jest.fn(() => true);
      const action = createAction({ dispatchBuiltinAction });
      const fn = jest.fn();
      action.set(ACTION_NAME, fn);

      action.executeJSON([{ [ACTION_NAME]: { a: 1 } }, { [BUILTIN_NAME]: { b: 2 } }]);
      expect(fn).toHaveBeenCalledWith({ a: 1 });
      expect(dispatchBuiltinAction).toHaveBeenCalledWith(BUILTIN_NAME, { b: 2 });
    });

    it("defers the whole dispatch by the given delay", () => {
      jest.useFakeTimers();
      try {
        const dispatchBuiltinAction = jest.fn(() => true);
        const action = createAction({ dispatchBuiltinAction });

        action.executeJSON([{ [BUILTIN_NAME]: {} }], undefined, 500);
        expect(dispatchBuiltinAction).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);
        expect(dispatchBuiltinAction).toHaveBeenCalledWith(BUILTIN_NAME, {});
      } finally {
        jest.useRealTimers();
      }
    });

    it("does nothing for an unknown built-in when no host is wired", () => {
      const action = createAction();
      expect(action.executeJSON([{ unknownType: {} }])).toBe(true);
    });
  });
});

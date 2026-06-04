import { clearProcessStack, getProcessStack, popProcess, pushProcess, subscribeProcessStack } from "../processStack";

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { logger } from "@/utils/logger";

const PROCESS_A = "PROCESS-A";
const PROCESS_B = "PROCESS-B";

describe("processStack", () => {
  let unsubscribe: (() => void) | undefined;

  afterEach(() => {
    clearProcessStack();
    unsubscribe?.();
    unsubscribe = undefined;
    (logger.warn as jest.Mock).mockClear();
  });

  it("pushes requests with increasing ids in push order", () => {
    const firstId = pushProcess({ processId: PROCESS_A });
    const secondId = pushProcess({ processId: PROCESS_B });

    expect(secondId).toBeGreaterThan(firstId);
    const stack = getProcessStack();
    expect(stack.map((request) => request.processId)).toEqual([PROCESS_A, PROCESS_B]);
    expect(stack.map((request) => request.id)).toEqual([firstId, secondId]);
  });

  it("returns a stable snapshot reference until the stack mutates", () => {
    const empty = getProcessStack();
    expect(getProcessStack()).toBe(empty);

    pushProcess({ processId: PROCESS_A });
    const afterPush = getProcessStack();
    expect(afterPush).not.toBe(empty);
    expect(getProcessStack()).toBe(afterPush);

    popProcess(afterPush[0].id);
    expect(getProcessStack()).not.toBe(afterPush);
  });

  it("pops the matching entry and is a no-op for an unknown id", () => {
    const keptId = pushProcess({ processId: PROCESS_A });
    const removedId = pushProcess({ processId: PROCESS_B });

    popProcess(removedId);
    expect(getProcessStack().map((request) => request.id)).toEqual([keptId]);

    const beforeUnknown = getProcessStack();
    popProcess(9999);
    expect(getProcessStack()).toBe(beforeUnknown);
  });

  it("notifies subscribers on push, pop and clear, and stops after unsubscribe", () => {
    const listener = jest.fn();
    unsubscribe = subscribeProcessStack(listener);

    const id = pushProcess({ processId: PROCESS_A });
    expect(listener).toHaveBeenCalledTimes(1);

    popProcess(id);
    expect(listener).toHaveBeenCalledTimes(2);

    pushProcess({ processId: PROCESS_B });
    clearProcessStack();
    expect(listener).toHaveBeenCalledTimes(4);

    unsubscribe();
    unsubscribe = undefined;
    pushProcess({ processId: PROCESS_A });
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it("clears the stack once and is a no-op when already empty", () => {
    const listener = jest.fn();
    unsubscribe = subscribeProcessStack(listener);

    pushProcess({ processId: PROCESS_A });
    listener.mockClear();

    clearProcessStack();
    expect(getProcessStack()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(1);

    clearProcessStack();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("warns when pushing without a mounted host", () => {
    pushProcess({ processId: PROCESS_A });
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});

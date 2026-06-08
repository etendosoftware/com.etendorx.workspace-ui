import {
  ask,
  clearDialogs,
  confirm,
  getDialogQueue,
  isc,
  peekDialog,
  resolveDialog,
  say,
  subscribeDialogs,
  warn,
} from "../dialogs";

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { logger } from "@/utils/logger";

describe("dialogs", () => {
  let unsubscribe: (() => void) | undefined;

  /** Simulates a mounted host so requests are queued instead of auto-resolved. */
  const mountHost = () => {
    unsubscribe = subscribeDialogs(() => {});
  };

  /** The first pending dialog, asserting one exists (narrows away `undefined`). */
  const nextDialog = () => {
    const request = peekDialog();
    if (!request) throw new Error("expected a pending dialog");
    return request;
  };

  afterEach(() => {
    clearDialogs(false);
    unsubscribe?.();
    unsubscribe = undefined;
    (logger.warn as jest.Mock).mockClear();
  });

  it("confirm resolves true when the dialog is accepted", async () => {
    mountHost();
    const promise = confirm("Proceed?");
    const request = nextDialog();
    expect(request.message).toBe("Proceed?");
    resolveDialog(request.id, true);
    await expect(promise).resolves.toBe(true);
  });

  it("confirm resolves false when the dialog is cancelled", async () => {
    mountHost();
    const promise = confirm("Proceed?");
    resolveDialog(nextDialog().id, false);
    await expect(promise).resolves.toBe(false);
  });

  it("honours the classic callback shape confirm(message, callback)", async () => {
    mountHost();
    const cb = jest.fn();
    const promise = confirm("Proceed?", cb);
    resolveDialog(nextDialog().id, true);
    await promise;
    expect(cb).toHaveBeenCalledWith(true);
  });

  it("honours confirm(message, options, callback) and carries the title", async () => {
    mountHost();
    const cb = jest.fn();
    const promise = confirm("Proceed?", { title: "Custom" }, cb);
    const request = nextDialog();
    expect(request.title).toBe("Custom");
    resolveDialog(request.id, true);
    await promise;
    expect(cb).toHaveBeenCalledWith(true);
  });

  it("say and warn resolve (awaitable) and fire their callback", async () => {
    mountHost();
    const sayCb = jest.fn();
    const sayPromise = say("Done", sayCb);
    resolveDialog(nextDialog().id, true);
    await expect(sayPromise).resolves.toBeUndefined();
    expect(sayCb).toHaveBeenCalled();

    const warnPromise = warn("Careful");
    resolveDialog(nextDialog().id, true);
    await expect(warnPromise).resolves.toBeUndefined();
  });

  it("isc namespace and ask alias mirror the standalone helpers", () => {
    expect(isc.confirm).toBe(confirm);
    expect(isc.warn).toBe(warn);
    expect(isc.say).toBe(say);
    expect(ask).toBe(confirm);
  });

  it("serializes the queue: one request at a time, FIFO", async () => {
    mountHost();
    const first = confirm("First");
    const second = confirm("Second");
    expect(getDialogQueue()).toHaveLength(2);
    expect(peekDialog()?.message).toBe("First");

    resolveDialog(nextDialog().id, true);
    expect(peekDialog()?.message).toBe("Second");

    resolveDialog(nextDialog().id, false);
    await expect(first).resolves.toBe(true);
    await expect(second).resolves.toBe(false);
  });

  it("auto-resolves confirm to false when no host is mounted", async () => {
    const promise = confirm("Proceed?");
    await expect(promise).resolves.toBe(false);
    expect(getDialogQueue()).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("clearDialogs resolves every pending dialog with false", async () => {
    mountHost();
    const a = confirm("A");
    const b = confirm("B");
    clearDialogs(false);
    await expect(a).resolves.toBe(false);
    await expect(b).resolves.toBe(false);
    expect(getDialogQueue()).toHaveLength(0);
  });

  it("exposes the classic isc.OBMessageBar.TYPE_* severity constants", () => {
    expect(isc.OBMessageBar).toEqual({
      TYPE_INFO: "info",
      TYPE_SUCCESS: "success",
      TYPE_WARNING: "warning",
      TYPE_ERROR: "error",
    });
  });
});

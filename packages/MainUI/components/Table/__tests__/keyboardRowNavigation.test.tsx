/**
 * Tests for keyboard row navigation (ArrowUp/ArrowDown) in Table grid view.
 * Exercises the real `useRowKeyboardNavigation` hook via a minimal mock table instance.
 */
import { renderHook, act } from "@testing-library/react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";
import type { MRT_TableInstance, MRT_RowSelectionState } from "material-react-table";
import { useRowKeyboardNavigation, computeNextIndex, NAVIGATION_DIRECTION } from "../hooks/useRowKeyboardNavigation";

const makeRecord = (id: string): EntityData => ({ id }) as EntityData;

interface MockTable {
  instance: MRT_TableInstance<EntityData>;
  setRowSelection: jest.Mock;
  getSelection: () => MRT_RowSelectionState;
}

const makeTable = (initial: MRT_RowSelectionState): MockTable => {
  let selection: MRT_RowSelectionState = initial;
  const setRowSelection = jest.fn((next: MRT_RowSelectionState) => {
    selection = next;
  });
  const instance = {
    getState: () => ({ rowSelection: selection }),
    setRowSelection,
  } as unknown as MRT_TableInstance<EntityData>;
  return { instance, setRowSelection, getSelection: () => selection };
};

describe("computeNextIndex", () => {
  it("returns next index inside bounds", () => {
    expect(computeNextIndex(0, NAVIGATION_DIRECTION.DOWN, 3)).toBe(1);
    expect(computeNextIndex(1, NAVIGATION_DIRECTION.UP, 3)).toBe(0);
  });

  it("returns null at top boundary", () => {
    expect(computeNextIndex(0, NAVIGATION_DIRECTION.UP, 3)).toBeNull();
  });

  it("returns null at bottom boundary", () => {
    expect(computeNextIndex(2, NAVIGATION_DIRECTION.DOWN, 3)).toBeNull();
  });

  it("returns null for empty list", () => {
    expect(computeNextIndex(0, NAVIGATION_DIRECTION.DOWN, 0)).toBeNull();
  });
});

describe("useRowKeyboardNavigation", () => {
  const records = [makeRecord("1"), makeRecord("2"), makeRecord("3")];
  let containerDiv: HTMLDivElement;
  let containerRef: React.RefObject<HTMLDivElement>;
  let insideElement: HTMLDivElement;
  let rafCallbacks: Array<FrameRequestCallback>;
  let originalRaf: typeof requestAnimationFrame;
  let originalCaf: typeof cancelAnimationFrame;

  beforeEach(() => {
    containerDiv = document.createElement("div");
    document.body.appendChild(containerDiv);
    insideElement = document.createElement("div");
    containerDiv.appendChild(insideElement);
    containerRef = { current: containerDiv } as React.RefObject<HTMLDivElement>;

    rafCallbacks = [];
    originalRaf = global.requestAnimationFrame;
    originalCaf = global.cancelAnimationFrame;
    global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    }) as typeof requestAnimationFrame;
    global.cancelAnimationFrame = ((id: number) => {
      rafCallbacks[id - 1] = () => undefined;
    }) as typeof cancelAnimationFrame;
  });

  afterEach(() => {
    document.body.removeChild(containerDiv);
    global.requestAnimationFrame = originalRaf;
    global.cancelAnimationFrame = originalCaf;
  });

  const flushRaf = () => {
    const callbacks = rafCallbacks;
    rafCallbacks = [];
    for (const cb of callbacks) cb(performance.now());
  };

  const makeEvent = (target: EventTarget) => {
    const event = new KeyboardEvent("keydown");
    Object.defineProperty(event, "target", { value: target, writable: false });
    return event;
  };

  const setupHook = (initialSelection: MRT_RowSelectionState, editingRowsCount = 0) => {
    const table = makeTable(initialSelection);
    const { result } = renderHook(() =>
      useRowKeyboardNavigation({
        table: table.instance,
        effectiveRecords: records,
        containerRef,
        editingRowsCount,
      })
    );
    return { result, table };
  };

  it("ArrowDown selects the next record after rAF flush", () => {
    const { result, table } = setupHook({ "1": true });
    act(() => result.current.handleArrowDown(makeEvent(insideElement)));
    expect(table.setRowSelection).not.toHaveBeenCalled();
    act(() => flushRaf());
    expect(table.setRowSelection).toHaveBeenCalledWith({ "2": true });
  });

  it("ArrowUp selects the previous record after rAF flush", () => {
    const { result, table } = setupHook({ "2": true });
    act(() => result.current.handleArrowUp(makeEvent(insideElement)));
    act(() => flushRaf());
    expect(table.setRowSelection).toHaveBeenCalledWith({ "1": true });
  });

  it("ArrowDown on last record does nothing", () => {
    const { result, table } = setupHook({ "3": true });
    act(() => result.current.handleArrowDown(makeEvent(insideElement)));
    act(() => flushRaf());
    expect(table.setRowSelection).not.toHaveBeenCalled();
  });

  it("ArrowUp on first record does nothing", () => {
    const { result, table } = setupHook({ "1": true });
    act(() => result.current.handleArrowUp(makeEvent(insideElement)));
    act(() => flushRaf());
    expect(table.setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when no row is selected", () => {
    const { result, table } = setupHook({});
    act(() => result.current.handleArrowDown(makeEvent(insideElement)));
    act(() => flushRaf());
    expect(table.setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when in inline edit mode (editingRowsCount > 0)", () => {
    const { result, table } = setupHook({ "1": true }, 1);
    act(() => result.current.handleArrowDown(makeEvent(insideElement)));
    act(() => flushRaf());
    expect(table.setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when event.target is outside the table container", () => {
    const outsideElement = document.createElement("div");
    document.body.appendChild(outsideElement);
    const { result, table } = setupHook({ "1": true });
    act(() => result.current.handleArrowDown(makeEvent(outsideElement)));
    act(() => flushRaf());
    expect(table.setRowSelection).not.toHaveBeenCalled();
    document.body.removeChild(outsideElement);
  });

  it("coalesces rapid sync ArrowDown events into one setRowSelection per frame", () => {
    const manyRecords = Array.from({ length: 50 }, (_, i) => makeRecord(String(i + 1)));
    const table = makeTable({ "1": true });
    const { result } = renderHook(() =>
      useRowKeyboardNavigation({
        table: table.instance,
        effectiveRecords: manyRecords,
        containerRef,
        editingRowsCount: 0,
      })
    );

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.handleArrowDown(makeEvent(insideElement));
      }
    });
    expect(table.setRowSelection).not.toHaveBeenCalled();

    act(() => flushRaf());
    expect(table.setRowSelection).toHaveBeenCalledTimes(1);
    // After one rAF flush, the pending index advances by 20 steps from the initial index 0.
    expect(table.setRowSelection).toHaveBeenCalledWith({ "21": true });
  });

  it("flags source as keyboard during navigation and resets on keyup", () => {
    const { result } = setupHook({ "1": true });
    expect(result.current.isKeyboardNavigationSource()).toBe(false);

    act(() => result.current.handleArrowDown(makeEvent(insideElement)));
    act(() => flushRaf());
    expect(result.current.isKeyboardNavigationSource()).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowDown" }));
    });
    expect(result.current.isKeyboardNavigationSource()).toBe(false);
  });
});

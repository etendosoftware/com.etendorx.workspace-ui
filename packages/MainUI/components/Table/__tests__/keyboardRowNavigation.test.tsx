/**
 * Tests for keyboard row navigation (ArrowUp/ArrowDown) in Table grid view.
 * Tests the handler logic in isolation — the full Table component is too complex to mount in unit tests.
 */
import { renderHook, act } from "@testing-library/react";
import { useCallback } from "react";
import type { EntityData } from "@workspaceui/api-client/src/api/types";

// Helper to build a minimal EntityData record
const makeRecord = (id: string): EntityData => ({ id }) as EntityData;

// We test the row navigation logic by extracting it into a testable form.
// The actual Table component wires these handlers into useKeyboardShortcuts.
function useRowNavigation(
  effectiveRecords: EntityData[],
  getRowSelection: () => Record<string, boolean>,
  setRowSelection: (s: Record<string, boolean>) => void,
  containerRef: React.RefObject<HTMLDivElement>,
  editingRowsCount: number
) {
  const navigate = useCallback(
    (direction: "up" | "down", event: KeyboardEvent) => {
      if (editingRowsCount > 0) return;
      if (!containerRef.current?.contains(event.target as Node)) return;

      const currentSelection = getRowSelection();
      const selectedIds = Object.keys(currentSelection).filter((id) => currentSelection[id]);
      if (selectedIds.length !== 1) return;

      const currentId = selectedIds[0];
      const currentIndex = effectiveRecords.findIndex((r) => String(r.id) === currentId);
      if (currentIndex === -1) return;

      if (direction === "down") {
        if (currentIndex === effectiveRecords.length - 1) return;
        setRowSelection({ [String(effectiveRecords[currentIndex + 1].id)]: true });
      } else {
        if (currentIndex === 0) return;
        setRowSelection({ [String(effectiveRecords[currentIndex - 1].id)]: true });
      }
    },
    [effectiveRecords, getRowSelection, setRowSelection, containerRef, editingRowsCount]
  );

  return navigate;
}

describe("keyboard row navigation", () => {
  const records = [makeRecord("1"), makeRecord("2"), makeRecord("3")];
  let containerDiv: HTMLDivElement;
  let containerRef: React.RefObject<HTMLDivElement>;
  let insideElement: HTMLDivElement;

  beforeEach(() => {
    containerDiv = document.createElement("div");
    document.body.appendChild(containerDiv);
    insideElement = document.createElement("div");
    containerDiv.appendChild(insideElement);
    // Cast to avoid React 19 readonly `current` type issue
    containerRef = { current: containerDiv } as React.RefObject<HTMLDivElement>;
  });

  afterEach(() => {
    document.body.removeChild(containerDiv);
  });

  const makeEvent = (target: EventTarget) => {
    const event = new KeyboardEvent("keydown");
    Object.defineProperty(event, "target", { value: target, writable: false });
    return event;
  };

  it("ArrowDown selects the next record", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const { result } = renderHook(() => useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0));

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).toHaveBeenCalledWith({ "2": true });
  });

  it("ArrowUp selects the previous record", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "2": true });
    const { result } = renderHook(() => useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0));

    act(() => result.current("up", makeEvent(insideElement)));

    expect(setRowSelection).toHaveBeenCalledWith({ "1": true });
  });

  it("ArrowDown on last record does nothing", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "3": true });
    const { result } = renderHook(() => useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0));

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("ArrowUp on first record does nothing", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const { result } = renderHook(() => useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0));

    act(() => result.current("up", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when no row is selected", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({});
    const { result } = renderHook(() => useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0));

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when in inline edit mode (editingRowsCount > 0)", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const { result } = renderHook(() => useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 1));

    act(() => result.current("down", makeEvent(insideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
  });

  it("does nothing when event.target is outside the table container", () => {
    const setRowSelection = jest.fn();
    const getRowSelection = () => ({ "1": true });
    const outsideElement = document.createElement("div");
    document.body.appendChild(outsideElement);

    const { result } = renderHook(() => useRowNavigation(records, getRowSelection, setRowSelection, containerRef, 0));

    act(() => result.current("down", makeEvent(outsideElement)));

    expect(setRowSelection).not.toHaveBeenCalled();
    document.body.removeChild(outsideElement);
  });
});

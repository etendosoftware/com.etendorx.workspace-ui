import { renderHook, fireEvent } from "@testing-library/react";
import { useKeyboardShortcuts } from "../useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  it("fires handler when matching shortcut is pressed", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires handler with Meta key (Mac) as ctrl equivalent", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

    fireEvent.keyDown(document, { key: "s", metaKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("fires handler for bare keys like Escape", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ Escape: { handler } }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire when focus is in an input and allowInInputs is false", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler, allowInInputs: false } }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "s", ctrlKey: true });
    document.body.removeChild(input);

    expect(handler).not.toHaveBeenCalled();
  });

  it("DOES fire when focus is in an input and allowInInputs is true", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler, allowInInputs: true } }));

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "s", ctrlKey: true });
    document.body.removeChild(input);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire when enabled is false", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }, false));

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it("calls preventDefault by default", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

    const event = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("does NOT call preventDefault when preventDefault is false", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ Escape: { handler, preventDefault: false } }));

    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");
    document.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it("removes listener on unmount", () => {
    const handler = jest.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

    unmount();
    fireEvent.keyDown(document, { key: "s", ctrlKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the KeyboardEvent to the handler", () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcuts({ Escape: { handler } }));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handler).toHaveBeenCalledWith(expect.any(KeyboardEvent));
  });

  describe("Shift combinations", () => {
    const pressCtrlShift = (key: string) => fireEvent.keyDown(document, { key, ctrlKey: true, shiftKey: true });

    it("fires a ctrl+shift shortcut", () => {
      const handler = jest.fn();
      renderHook(() => useKeyboardShortcuts({ "ctrl+shift+y": { handler } }));

      pressCtrlShift("Y");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("prefers the ctrl+shift shortcut over the plain ctrl one", () => {
      const shiftHandler = jest.fn();
      const ctrlHandler = jest.fn();
      renderHook(() =>
        useKeyboardShortcuts({ "ctrl+shift+y": { handler: shiftHandler }, "ctrl+y": { handler: ctrlHandler } })
      );

      pressCtrlShift("Y");

      expect(shiftHandler).toHaveBeenCalledTimes(1);
      expect(ctrlHandler).not.toHaveBeenCalled();
    });

    it("falls back to the plain ctrl shortcut when no ctrl+shift one is mapped", () => {
      const handler = jest.fn();
      renderHook(() => useKeyboardShortcuts({ "ctrl+s": { handler } }));

      pressCtrlShift("S");

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire a ctrl+shift shortcut without Shift", () => {
      const handler = jest.fn();
      renderHook(() => useKeyboardShortcuts({ "ctrl+shift+y": { handler } }));

      fireEvent.keyDown(document, { key: "y", ctrlKey: true });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});

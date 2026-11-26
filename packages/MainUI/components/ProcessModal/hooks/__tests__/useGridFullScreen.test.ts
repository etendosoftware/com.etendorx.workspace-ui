import { fireEvent, renderHook } from "@testing-library/react";
import { getFullScreenWrapperStyle, useExitFullScreenOnEscape } from "../useGridFullScreen";

describe("useExitFullScreenOnEscape (ETP-6312)", () => {
  it("leaves the full screen on Escape", () => {
    const exit = jest.fn();
    renderHook(() => useExitFullScreenOnEscape(true, exit));

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(exit).toHaveBeenCalledTimes(1);
  });

  it("stops Escape before the modal listener on the document, which would close the process", () => {
    const modalClose = jest.fn();
    document.addEventListener("keydown", modalClose, true);
    renderHook(() => useExitFullScreenOnEscape(true, jest.fn()));

    fireEvent.keyDown(document.body, { key: "Escape" });
    document.removeEventListener("keydown", modalClose, true);

    expect(modalClose).not.toHaveBeenCalled();
  });

  it("ignores the other keys and lets them through", () => {
    const exit = jest.fn();
    const other = jest.fn();
    document.addEventListener("keydown", other, true);
    renderHook(() => useExitFullScreenOnEscape(true, exit));

    fireEvent.keyDown(document.body, { key: "Enter" });
    document.removeEventListener("keydown", other, true);

    expect(exit).not.toHaveBeenCalled();
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("does not take Escape when the grid is not in full screen, so it closes the process", () => {
    const exit = jest.fn();
    const modalClose = jest.fn();
    document.addEventListener("keydown", modalClose, true);
    renderHook(() => useExitFullScreenOnEscape(false, exit));

    fireEvent.keyDown(document.body, { key: "Escape" });
    document.removeEventListener("keydown", modalClose, true);

    expect(exit).not.toHaveBeenCalled();
    expect(modalClose).toHaveBeenCalledTimes(1);
  });

  it("stops listening once the grid leaves the full screen", () => {
    const exit = jest.fn();
    const { rerender } = renderHook(({ fullScreen }) => useExitFullScreenOnEscape(fullScreen, exit), {
      initialProps: { fullScreen: true },
    });

    rerender({ fullScreen: false });
    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(exit).not.toHaveBeenCalled();
  });

  it("removes the listener on unmount", () => {
    const exit = jest.fn();
    const { unmount } = renderHook(() => useExitFullScreenOnEscape(true, exit));

    unmount();
    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(exit).not.toHaveBeenCalled();
  });
});

describe("getFullScreenWrapperStyle (ETP-6312)", () => {
  it("keeps the height of the grid while it is in full screen", () => {
    expect(getFullScreenWrapperStyle(true, 350)).toEqual({ minHeight: 350 });
  });

  it("adds no style while the grid is in the flow", () => {
    expect(getFullScreenWrapperStyle(false, 350)).toBeUndefined();
  });
});

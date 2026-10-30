import { renderHook, act } from "@testing-library/react";
import { FocusProvider, useFocusContext } from "../focus";

const wrapper = ({ children }: React.PropsWithChildren) => <FocusProvider>{children}</FocusProvider>;

describe("FocusContext", () => {
  it("starts with activeFocusId = null", () => {
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    expect(result.current.activeFocusId).toBeNull();
  });

  it("setFocus updates activeFocusId", () => {
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => result.current.setFocus("tab-1"));
    expect(result.current.activeFocusId).toBe("tab-1");
  });

  it("setFocus calls onBlur of the previous region", () => {
    const onBlur = jest.fn();
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => {
      result.current.registerRegion({ id: "tab-1", onBlur });
      result.current.setFocus("tab-1");
    });
    act(() => result.current.setFocus("tab-2"));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("setFocus to same id is a no-op (onBlur not called)", () => {
    const onBlur = jest.fn();
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => {
      result.current.registerRegion({ id: "tab-1", onBlur });
      result.current.setFocus("tab-1");
    });
    act(() => result.current.setFocus("tab-1"));
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("unregisterRegion removes the region so onBlur is not called", () => {
    const onBlur = jest.fn();
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => {
      result.current.registerRegion({ id: "tab-1", onBlur });
      result.current.setFocus("tab-1");
    });
    act(() => result.current.unregisterRegion("tab-1"));
    act(() => result.current.setFocus("tab-2"));
    expect(onBlur).not.toHaveBeenCalled();
  });

  it("hasRegion reports only the mounted regions", () => {
    const { result } = renderHook(() => useFocusContext(), { wrapper });
    act(() => result.current.registerRegion({ id: "tab-1" }));
    expect(result.current.hasRegion("tab-1")).toBe(true);
    expect(result.current.hasRegion("tab-2")).toBe(false);

    act(() => result.current.unregisterRegion("tab-1"));
    expect(result.current.hasRegion("tab-1")).toBe(false);
  });
});

describe("FocusContext scope", () => {
  /** Renders a scoped consumer next to an unscoped one that moves the focus, and counts the scoped renders. */
  const setup = (scope: readonly string[]) => {
    let scopedRenders = 0;
    const { result } = renderHook(
      () => {
        const all = useFocusContext();
        const scoped = useFocusContext(scope);
        scopedRenders++;
        return { all, scoped };
      },
      { wrapper }
    );
    return { result, renders: () => scopedRenders };
  };

  it("reports the focus while it is on one of the scope's regions", () => {
    const { result } = setup(["tab-1", "tab-2"]);

    act(() => result.current.all.setFocus("tab-2"));

    expect(result.current.scoped.activeFocusId).toBe("tab-2");
  });

  it("reports null while the focus is on a region outside the scope", () => {
    const { result } = setup(["tab-1"]);

    act(() => result.current.all.setFocus("other-window-tab"));

    expect(result.current.scoped.activeFocusId).toBeNull();
    expect(result.current.all.activeFocusId).toBe("other-window-tab");
  });

  it("does not update a scoped consumer when the focus moves between regions outside its scope", () => {
    const received: (string | null)[] = [];
    const { result } = renderHook(
      () => {
        const scoped = useFocusContext(["tab-1"]);
        received.push(scoped.activeFocusId);
        return scoped;
      },
      { wrapper }
    );
    const renderCount = received.length;

    act(() => result.current.setFocus("other-1"));
    act(() => result.current.setFocus("other-2"));

    expect(received).toHaveLength(renderCount);
  });

  it("updates a scoped consumer when the focus enters and leaves its scope", () => {
    const { result } = setup(["tab-1"]);

    act(() => result.current.all.setFocus("tab-1"));
    expect(result.current.scoped.activeFocusId).toBe("tab-1");

    act(() => result.current.all.setFocus("other"));
    expect(result.current.scoped.activeFocusId).toBeNull();
  });

  it("never reports the focus to an empty scope, which only moves it", () => {
    const { result } = setup([]);

    act(() => result.current.all.setFocus("tab-1"));

    expect(result.current.scoped.activeFocusId).toBeNull();
  });

  it("keeps the actions of a scoped consumer working", () => {
    const { result } = setup([]);

    act(() => result.current.scoped.setFocus("tab-9"));

    expect(result.current.all.activeFocusId).toBe("tab-9");
  });
});

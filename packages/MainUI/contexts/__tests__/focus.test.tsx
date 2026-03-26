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
});

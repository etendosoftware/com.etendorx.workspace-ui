import { renderHook, act } from "@testing-library/react";
import { FocusProvider } from "@/contexts/focus";
import { useFocusRegion } from "../useFocusRegion";

const wrapper = ({ children }: React.PropsWithChildren) => {
  const React = require("react");
  return React.createElement(FocusProvider, null, children);
};

describe("useFocusRegion", () => {
  it("isFocused is false initially", () => {
    const { result } = renderHook(() => useFocusRegion("tab-1"), { wrapper });
    expect(result.current.isFocused).toBe(false);
  });

  it("isFocused becomes true after acquire()", () => {
    const { result } = renderHook(() => useFocusRegion("tab-1"), { wrapper });
    act(() => result.current.acquire());
    expect(result.current.isFocused).toBe(true);
  });

  it("calls the previous region's onBlur when another region acquires focus", () => {
    const onBlurHeader = jest.fn();
    const { result } = renderHook(
      () => ({
        header: useFocusRegion("header", { onBlur: onBlurHeader }),
        lines: useFocusRegion("lines"),
      }),
      { wrapper }
    );

    act(() => result.current.header.acquire());
    act(() => result.current.lines.acquire());

    expect(onBlurHeader).toHaveBeenCalledTimes(1);
    expect(result.current.header.isFocused).toBe(false);
    expect(result.current.lines.isFocused).toBe(true);
  });

  it("onBlur always uses the latest closure (ref pattern)", () => {
    const onBlur1 = jest.fn();
    const onBlur2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ onBlur }: { onBlur: () => void }) => ({
        header: useFocusRegion("header", { onBlur }),
        lines: useFocusRegion("lines"),
      }),
      { wrapper, initialProps: { onBlur: onBlur1 } }
    );

    act(() => result.current.header.acquire());
    // Rerender with a new onBlur (simulates state change in parent)
    rerender({ onBlur: onBlur2 });
    act(() => result.current.lines.acquire());

    // Should have called the LATEST onBlur (onBlur2), not onBlur1
    expect(onBlur1).not.toHaveBeenCalled();
    expect(onBlur2).toHaveBeenCalledTimes(1);
  });
});

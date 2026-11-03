import { act, fireEvent, render, screen } from "@testing-library/react";

// Mock TabButton to expose the "active" prop in markup for easier assertions
jest.mock("@/components/window/TabButton", () => ({
  TabButton: ({ tab, active, onClick, onDoubleClick }: any) => (
    <button
      data-testid={`tab-${tab.id}`}
      aria-label={tab.name}
      data-active={String(!!active)}
      onClick={() => onClick(tab)}
      onDoubleClick={() => onDoubleClick(tab)}>
      {tab.name}
    </button>
  ),
}));

import { SubTabsSwitch } from "./SubTabsSwitch";

describe("SubTabsSwitch - activeTabId visual state", () => {
  const tabs = [
    { id: "t1", name: "Tab 1", tabLevel: 1 },
    { id: "t2", name: "Tab 2", tabLevel: 1 },
  ] as any[];

  it("usa activeTabId en lugar de current para marcar activo", () => {
    render(
      <SubTabsSwitch
        tabs={tabs as any}
        current={tabs[0]}
        activeTabId={tabs[1].id}
        onClick={jest.fn()}
        onDoubleClick={jest.fn()}
        onClose={jest.fn()}
        collapsed={false}
      />
    );

    expect(screen.getByTestId("tab-t2")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("tab-t1")).toHaveAttribute("data-active", "false");
  });
});

describe("SubTabsSwitch - scrolling strip", () => {
  const tabs = [
    { id: "t1", name: "Tab 1", tabLevel: 1 },
    { id: "t2", name: "Tab 2", tabLevel: 1 },
  ] as any[];

  const renderStrip = () => {
    render(
      <SubTabsSwitch
        tabs={tabs as any}
        current={tabs[0]}
        onClick={jest.fn()}
        onDoubleClick={jest.fn()}
        onClose={jest.fn()}
        collapsed={false}
      />
    );
    return screen.getByTestId("SubTabsSwitch__strip");
  };

  /** jsdom does no layout: the sizes the strip would have are set by hand and the scroll is announced. */
  const layout = (strip: HTMLElement, { scrollWidth, clientWidth, scrollLeft }: Record<string, number>) => {
    Object.defineProperty(strip, "scrollWidth", { configurable: true, value: scrollWidth });
    Object.defineProperty(strip, "clientWidth", { configurable: true, value: clientWidth });
    Object.defineProperty(strip, "scrollLeft", { configurable: true, writable: true, value: scrollLeft });
    act(() => {
      fireEvent.scroll(strip);
    });
  };

  it("hides the native scrollbar", () => {
    expect(renderStrip()).toHaveClass("hide-scrollbar");
  });

  it("does not fade the edges while every tab fits", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 100, clientWidth: 100, scrollLeft: 0 });

    expect(strip.style.maskImage).toBe("");
  });

  it("fades only the right edge at the start, where the other tabs are", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 0 });

    expect(strip.style.maskImage).toContain("#000 0px");
    expect(strip.style.maskImage).toContain("calc(100% - 28px)");
  });

  it("fades both edges once it was scrolled and there is more on the right", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 50 });

    expect(strip.style.maskImage).toContain("#000 28px");
    expect(strip.style.maskImage).toContain("calc(100% - 28px)");
  });

  it("fades only the left edge at the end of the strip", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 200 });

    expect(strip.style.maskImage).toContain("#000 28px");
    expect(strip.style.maskImage).toContain("calc(100% - 0px)");
  });

  it("scrolls sideways with the vertical wheel, without scrolling the page", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 0 });

    const wheel = new WheelEvent("wheel", { deltaY: 40, cancelable: true });
    strip.dispatchEvent(wheel);

    expect(strip.scrollLeft).toBe(40);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it("leaves the wheel alone when nothing overflows or the gesture is already sideways", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 100, clientWidth: 100, scrollLeft: 0 });
    const fits = new WheelEvent("wheel", { deltaY: 40, cancelable: true });
    strip.dispatchEvent(fits);
    expect(fits.defaultPrevented).toBe(false);

    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 0 });
    const sideways = new WheelEvent("wheel", { deltaX: 40, deltaY: 5, cancelable: true });
    strip.dispatchEvent(sideways);
    expect(sideways.defaultPrevented).toBe(false);
    expect(strip.scrollLeft).toBe(0);
  });

  it("shows no arrows while every tab fits", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 100, clientWidth: 100, scrollLeft: 0 });

    expect(screen.queryByTestId("SubTabsSwitch__scroll_back")).toBeNull();
    expect(screen.queryByTestId("SubTabsSwitch__scroll_forward")).toBeNull();
  });

  it("keeps both arrows together, next to the collapse button, while the strip scrolls, dimming the one with nothing left to show", () => {
    const strip = renderStrip();
    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 0 });
    expect(screen.getByTestId("SubTabsSwitch__scroll_back")).toBeDisabled();
    expect(screen.getByTestId("SubTabsSwitch__scroll_forward")).toBeEnabled();

    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 100 });
    expect(screen.getByTestId("SubTabsSwitch__scroll_back")).toBeEnabled();
    expect(screen.getByTestId("SubTabsSwitch__scroll_forward")).toBeEnabled();

    layout(strip, { scrollWidth: 300, clientWidth: 100, scrollLeft: 200 });
    expect(screen.getByTestId("SubTabsSwitch__scroll_back")).toBeEnabled();
    expect(screen.getByTestId("SubTabsSwitch__scroll_forward")).toBeDisabled();
  });

  it("moves the strip about a page when an arrow is pressed", () => {
    const strip = renderStrip();
    const scrollBy = jest.fn();
    strip.scrollBy = scrollBy;
    layout(strip, { scrollWidth: 1000, clientWidth: 400, scrollLeft: 100 });

    fireEvent.click(screen.getByTestId("SubTabsSwitch__scroll_forward"));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 240, behavior: "smooth" });

    fireEvent.click(screen.getByTestId("SubTabsSwitch__scroll_back"));
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -240, behavior: "smooth" });
  });

  it("does not toggle the tab panel when an arrow is pressed twice quickly", () => {
    const onDoubleClick = jest.fn();
    render(
      <SubTabsSwitch
        tabs={tabs as any}
        current={tabs[0]}
        onClick={jest.fn()}
        onDoubleClick={onDoubleClick}
        onClose={jest.fn()}
        collapsed={false}
      />
    );
    layout(screen.getByTestId("SubTabsSwitch__strip"), { scrollWidth: 300, clientWidth: 100, scrollLeft: 0 });

    fireEvent.doubleClick(screen.getByTestId("SubTabsSwitch__scroll_forward"));

    expect(onDoubleClick).not.toHaveBeenCalled();
  });
});

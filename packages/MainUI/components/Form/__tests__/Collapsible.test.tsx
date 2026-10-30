import { act, fireEvent, render, screen } from "@testing-library/react";
import { SECTION_TRANSITION_MS } from "@/utils/form/expandedSections";
import Collapsible from "../Collapsible";

jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({ children, tabIndex, "data-testid": testId }: any) => (
    <span tabIndex={tabIndex} data-testid={testId}>
      {children}
    </span>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/chevron-up.svg", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: any) => <svg data-testid={testId} />,
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: any) => <svg data-testid={testId} />,
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/file-text.svg", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: any) => <svg data-testid={testId} />,
}));

const observe = jest.fn();
const disconnect = jest.fn();
let resizeCallback: () => void = () => undefined;

const renderSection = (props: Partial<React.ComponentProps<typeof Collapsible>> = {}) =>
  render(
    <Collapsible title="Main" sectionId="main" isExpanded {...props}>
      <input data-testid="field" />
    </Collapsible>
  );

/** The header is the only element that carries aria-expanded. */
const header = (container: HTMLElement) => container.querySelector("[aria-expanded]") as HTMLElement;
const content = (container: HTMLElement) => container.querySelector("#section-content-main") as HTMLElement;

describe("Collapsible", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    observe.mockClear();
    disconnect.mockClear();
    global.ResizeObserver = jest.fn((callback: () => void) => {
      resizeCallback = callback;
      return { observe, disconnect, unobserve: jest.fn() };
    }) as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows its title and children", () => {
    const { container } = renderSection();

    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(container.querySelector("#section-main")).toBeInTheDocument();
    expect(screen.getByTestId("field")).toBeInTheDocument();
  });

  it("wraps its children in a div unless it is given one", () => {
    const { container } = render(
      <Collapsible title="Main" sectionId="main" isExpanded>
        <div data-testid="own-div">own</div>
      </Collapsible>
    );

    expect(content(container).firstElementChild?.firstElementChild).toBe(screen.getByTestId("own-div"));
  });

  it("tells whether it is expanded, and controls its content", () => {
    const { container, rerender } = renderSection({ isExpanded: true });

    expect(header(container)).toHaveAttribute("aria-expanded", "true");
    expect(header(container)).toHaveAttribute("aria-controls", "section-content-main");
    expect(content(container)).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByTestId("ChevronUp__650187_1")).toBeInTheDocument();

    rerender(
      <Collapsible title="Main" sectionId="main" isExpanded={false}>
        <input data-testid="field" />
      </Collapsible>
    );

    expect(header(container)).toHaveAttribute("aria-expanded", "false");
    expect(content(container)).toHaveAttribute("aria-hidden", "true");
    expect(content(container).style.height).toBe("0px");
    expect(screen.getByTestId("ChevronDown__650187_1")).toBeInTheDocument();
  });

  it("uses the icon it is given instead of the default one", () => {
    renderSection({ icon: <i data-testid="custom-icon" /> });

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("InfoIcon__650187_1")).not.toBeInTheDocument();
  });

  it("asks to collapse when the header is clicked once the animation of the first render is over", () => {
    const onToggle = jest.fn();
    const { container } = renderSection({ isExpanded: true, onToggle });
    act(() => {
      jest.advanceTimersByTime(SECTION_TRANSITION_MS);
    });

    fireEvent.click(header(container));

    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("asks to expand when a collapsed section is clicked", () => {
    const onToggle = jest.fn();
    const { container } = renderSection({ isExpanded: false, onToggle });
    act(() => {
      jest.advanceTimersByTime(SECTION_TRANSITION_MS);
    });

    fireEvent.click(header(container));

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("ignores clicks while it is animating", () => {
    const onToggle = jest.fn();
    const { container } = renderSection({ onToggle });

    fireEvent.click(header(container));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("toggles with Enter and Space, and with no other key", () => {
    const onToggle = jest.fn();
    const { container } = renderSection({ onToggle });
    act(() => {
      jest.advanceTimersByTime(SECTION_TRANSITION_MS);
    });

    fireEvent.keyDown(header(container), { key: "Enter" });
    fireEvent.keyDown(header(container), { key: " " });
    fireEvent.keyDown(header(container), { key: "a" });

    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it("does nothing when it has no onToggle", () => {
    const { container } = renderSection({ onToggle: undefined });
    act(() => {
      jest.advanceTimersByTime(SECTION_TRANSITION_MS);
    });

    expect(() => fireEvent.click(header(container))).not.toThrow();
  });

  it("follows the height of its content while it is open", () => {
    const { container } = renderSection();
    const inner = content(container).firstElementChild as HTMLElement;
    Object.defineProperty(inner, "scrollHeight", { configurable: true, value: 120 });

    act(() => resizeCallback());

    expect(observe).toHaveBeenCalledWith(inner);
    expect(content(container).style.height).toBe("120px");
  });

  it("stops observing its content when it unmounts", () => {
    const { unmount } = renderSection();

    unmount();

    expect(disconnect).toHaveBeenCalled();
  });

  describe("tab stops of the fields", () => {
    it("takes them out of the tab order while collapsed and gives them back when expanded", () => {
      const { rerender } = renderSection({ isExpanded: false });
      const field = screen.getByTestId("field");

      expect(field).toHaveAttribute("tabindex", "-1");
      expect(field.dataset.originalTabIndex).toBe("0");

      rerender(
        <Collapsible title="Main" sectionId="main" isExpanded>
          <input data-testid="field" />
        </Collapsible>
      );

      expect(field).toHaveAttribute("tabindex", "0");
      expect(field.dataset.originalTabIndex).toBeUndefined();
    });

    it("remembers the tabindex a field had", () => {
      const { rerender } = render(
        <Collapsible title="Main" sectionId="main" isExpanded={false}>
          <input data-testid="field" tabIndex={-1} />
        </Collapsible>
      );
      const field = screen.getByTestId("field");

      expect(field.dataset.originalTabIndex).toBe("-1");

      rerender(
        <Collapsible title="Main" sectionId="main" isExpanded>
          <input data-testid="field" tabIndex={-1} />
        </Collapsible>
      );

      expect(field).toHaveAttribute("tabindex", "-1");
    });
  });
});

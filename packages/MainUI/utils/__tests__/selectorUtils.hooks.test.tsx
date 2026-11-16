import { act, renderHook } from "@testing-library/react";
import type { KeyboardEvent } from "react";
import {
  handleKeyboardActivation,
  useClickOutside,
  useFocusHandler,
  useHoverHandlers,
  useInfiniteScroll,
  useKeyboardNavigation,
  useOpenDropdownEffect,
  useSearchTermHandler,
} from "../selectorUtils";

const OPTIONS = [
  { id: "1", label: "One" },
  { id: "2", label: "Two" },
  { id: "3", label: "Three" },
];

const keyEvent = (key: string) => ({ key, preventDefault: jest.fn() }) as unknown as KeyboardEvent<Element>;

describe("useKeyboardNavigation", () => {
  const setup = (highlightedIndex = 0, onTab?: jest.Mock) => {
    const setHighlightedIndex = jest.fn();
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation(OPTIONS, highlightedIndex, setHighlightedIndex, onSelect, onClose, onTab)
    );
    return { handler: result.current, setHighlightedIndex, onSelect, onClose };
  };

  it("moves the highlight down, wrapping at the end", () => {
    const { handler, setHighlightedIndex } = setup();
    const event = keyEvent("ArrowDown");

    handler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    const update = setHighlightedIndex.mock.calls[0][0] as (prev: number) => number;
    expect(update(0)).toBe(1);
    expect(update(2)).toBe(0);
  });

  it("moves the highlight up, wrapping at the start", () => {
    const { handler, setHighlightedIndex } = setup();

    handler(keyEvent("ArrowUp"));

    const update = setHighlightedIndex.mock.calls[0][0] as (prev: number) => number;
    expect(update(2)).toBe(1);
    expect(update(0)).toBe(2);
    expect(update(-1)).toBe(2);
  });

  it("selects the highlighted option on Enter", () => {
    const { handler, onSelect } = setup(1);

    handler(keyEvent("Enter"));

    expect(onSelect).toHaveBeenCalledWith(OPTIONS[1]);
  });

  it("does not select anything on Enter without a highlighted option", () => {
    const { handler, onSelect } = setup(-1);

    handler(keyEvent("Enter"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const { handler, onClose } = setup();

    handler(keyEvent("Escape"));

    expect(onClose).toHaveBeenCalled();
  });

  it("hands Tab to the optional handler with the highlighted option", () => {
    const onTab = jest.fn();
    const { handler, setHighlightedIndex } = setup(2, onTab);
    const event = keyEvent("Tab");

    handler(event);

    expect(onTab).toHaveBeenCalledWith(event, OPTIONS[2]);
    expect(setHighlightedIndex).not.toHaveBeenCalled();
  });

  it("ignores Tab when there is no handler", () => {
    const { handler, onSelect, onClose } = setup();

    handler(keyEvent("Tab"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("useClickOutside", () => {
  const mouseDown = (target: Element) => {
    const event = new MouseEvent("mousedown", { bubbles: true });
    target.dispatchEvent(event);
  };

  it("closes when the click is outside every ref", () => {
    const inside = document.createElement("div");
    const outside = document.createElement("div");
    document.body.append(inside, outside);
    const setIsOpen = jest.fn();
    renderHook(() => useClickOutside({ current: inside }, setIsOpen));

    mouseDown(outside);

    expect(setIsOpen).toHaveBeenCalledWith(false);
    inside.remove();
    outside.remove();
  });

  it("ignores clicks inside the wrapper", () => {
    const inside = document.createElement("div");
    const child = document.createElement("span");
    inside.append(child);
    document.body.append(inside);
    const setIsOpen = jest.fn();
    renderHook(() => useClickOutside({ current: inside }, setIsOpen));

    mouseDown(child);

    expect(setIsOpen).not.toHaveBeenCalled();
    inside.remove();
  });

  it("ignores clicks inside an additional ref such as a portal", () => {
    const wrapper = document.createElement("div");
    const portal = document.createElement("div");
    document.body.append(wrapper, portal);
    const setIsOpen = jest.fn();
    renderHook(() => useClickOutside({ current: wrapper }, setIsOpen, [{ current: portal }]));

    mouseDown(portal);

    expect(setIsOpen).not.toHaveBeenCalled();
    wrapper.remove();
    portal.remove();
  });

  it("stops listening when it unmounts", () => {
    const wrapper = document.createElement("div");
    const outside = document.createElement("div");
    document.body.append(wrapper, outside);
    const setIsOpen = jest.fn();
    const { unmount } = renderHook(() => useClickOutside({ current: wrapper }, setIsOpen));

    unmount();
    mouseDown(outside);

    expect(setIsOpen).not.toHaveBeenCalled();
    wrapper.remove();
    outside.remove();
  });
});

describe("useInfiniteScroll", () => {
  const list = (scrollTop: number, clientHeight: number, scrollHeight: number) =>
    ({ current: { scrollTop, clientHeight, scrollHeight } }) as unknown as React.RefObject<HTMLUListElement>;

  it("loads more near the bottom of the list", () => {
    const onLoadMore = jest.fn();
    const { result } = renderHook(() => useInfiniteScroll(list(80, 20, 100), false, true, onLoadMore));

    result.current();

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["it is far from the bottom", list(0, 20, 100), false, true],
    ["it is already loading", list(80, 20, 100), true, true],
    ["there is nothing more to load", list(80, 20, 100), false, false],
  ])("does not load more when %s", (_label, ref, loading, hasMore) => {
    const onLoadMore = jest.fn();
    const { result } = renderHook(() => useInfiniteScroll(ref, loading, hasMore, onLoadMore));

    result.current();

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("does nothing without a list element", () => {
    const onLoadMore = jest.fn();
    const { result } = renderHook(() =>
      useInfiniteScroll({ current: null } as unknown as React.RefObject<HTMLUListElement>, false, true, onLoadMore)
    );

    result.current();

    expect(onLoadMore).not.toHaveBeenCalled();
  });
});

describe("small handlers", () => {
  it("tracks hover", () => {
    const setIsHovering = jest.fn();
    const { result } = renderHook(() => useHoverHandlers(setIsHovering));

    result.current.handleMouseEnter();
    result.current.handleMouseLeave();

    expect(setIsHovering.mock.calls).toEqual([[true], [false]]);
  });

  it("calls the focus callback only when there is one", () => {
    const onFocus = jest.fn();
    renderHook(() => useFocusHandler(onFocus)).result.current();
    expect(onFocus).toHaveBeenCalledTimes(1);

    expect(() => renderHook(() => useFocusHandler()).result.current()).not.toThrow();
  });

  it("stores the term the change handler returns", () => {
    const handleSearchChange = jest.fn().mockReturnValue("abc");
    const setSearchTerm = jest.fn();
    const { result } = renderHook(() => useSearchTermHandler(handleSearchChange, setSearchTerm));

    result.current({ target: { value: "abc" } } as React.ChangeEvent<HTMLInputElement>);

    expect(setSearchTerm).toHaveBeenCalledWith("abc");
  });

  it.each(["Enter", " "])("activates on %p", (key) => {
    const callback = jest.fn();
    const event = keyEvent(key);

    handleKeyboardActivation(event, callback);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not activate on other keys", () => {
    const callback = jest.fn();

    handleKeyboardActivation(keyEvent("a"), callback);

    expect(callback).not.toHaveBeenCalled();
  });
});

describe("useOpenDropdownEffect", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("clears the term, highlights the first option and focuses the input when it opens", () => {
    const setSearchTerm = jest.fn();
    const setHighlightedIndex = jest.fn();
    const input = document.createElement("input");
    const focus = jest.spyOn(input, "focus");

    renderHook(() => useOpenDropdownEffect(true, setSearchTerm, setHighlightedIndex, { current: input }));
    act(() => {
      jest.runAllTimers();
    });

    expect(setSearchTerm).toHaveBeenCalledWith("");
    expect(setHighlightedIndex).toHaveBeenCalledWith(0);
    expect(focus).toHaveBeenCalled();
  });

  it("does nothing while it is closed", () => {
    const setSearchTerm = jest.fn();
    const setHighlightedIndex = jest.fn();

    renderHook(() => useOpenDropdownEffect(false, setSearchTerm, setHighlightedIndex, { current: null }));

    expect(setSearchTerm).not.toHaveBeenCalled();
    expect(setHighlightedIndex).not.toHaveBeenCalled();
  });
});

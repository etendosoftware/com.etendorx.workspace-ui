import { act, render, screen } from "@testing-library/react";
import { useSplitPaneFocus } from "@/hooks/useSplitPaneFocus";
import { GRID_FOCUS_TARGET_ATTRIBUTE, SPLIT_PANES } from "@/utils/window/splitView";

const TEST_IDS = {
  FOCUSED_PANE: "focused-pane",
  GRID_PANE: "grid-pane",
  GRID_TARGET: "grid-target",
  FORM_PANE: "form-pane",
  FORM_INPUT: "form-input",
  FORM_INPUT_LAST: "form-input-last",
} as const;

interface HarnessProps {
  isDualPane: boolean;
  shouldShowForm: boolean;
  isTabFocused: boolean;
  /** Lets a test drop the marked focus target to exercise the fallback. */
  hasGridFocusTarget?: boolean;
  onRender?: () => void;
}

/**
 * Reproduces the pane structure of `Tab.tsx`: two sibling containers made
 * focusable with `tabIndex`, the grid one holding the marked focus target.
 */
function Harness({ isDualPane, shouldShowForm, isTabFocused, hasGridFocusTarget = true, onRender }: HarnessProps) {
  const { focusedPane, gridPaneRef, formPaneRef, handleGridPaneFocus, handleFormPaneFocus } = useSplitPaneFocus({
    isDualPane,
    shouldShowForm,
    isTabFocused,
  });

  onRender?.();

  return (
    <div>
      <span data-testid={TEST_IDS.FOCUSED_PANE}>{focusedPane}</span>
      <div ref={gridPaneRef} tabIndex={-1} onFocus={handleGridPaneFocus} data-testid={TEST_IDS.GRID_PANE}>
        {hasGridFocusTarget && (
          <div tabIndex={-1} data-testid={TEST_IDS.GRID_TARGET} {...{ [GRID_FOCUS_TARGET_ATTRIBUTE]: "" }} />
        )}
      </div>
      {shouldShowForm && (
        <div ref={formPaneRef} tabIndex={-1} onFocus={handleFormPaneFocus} data-testid={TEST_IDS.FORM_PANE}>
          <input data-testid={TEST_IDS.FORM_INPUT} />
          <input data-testid={TEST_IDS.FORM_INPUT_LAST} />
        </div>
      )}
    </div>
  );
}

const CLOSED_SPLIT: HarnessProps = { isDualPane: false, shouldShowForm: false, isTabFocused: true };

const renderHarness = (props: Partial<HarnessProps> = {}) => {
  const merged = { ...CLOSED_SPLIT, ...props };
  const view = render(<Harness {...merged} />);
  const rerenderWith = (next: Partial<HarnessProps>) => view.rerender(<Harness {...merged} {...next} />);
  return { ...view, rerenderWith };
};

const OPEN_SPLIT: Partial<HarnessProps> = { isDualPane: true, shouldShowForm: true };

const focusedPaneText = () => screen.getByTestId(TEST_IDS.FOCUSED_PANE).textContent;

const focusElement = (testId: string) => {
  act(() => {
    screen.getByTestId(testId).focus();
  });
};

const pressNextPane = () => {
  act(() => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "F6", bubbles: true, cancelable: true }));
  });
};

describe("useSplitPaneFocus", () => {
  it("hands the DOM focus to the form pane when both panes appear", () => {
    const { rerenderWith } = renderHarness();

    act(() => rerenderWith(OPEN_SPLIT));

    expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.FORM_PANE));
    expect(focusedPaneText()).toBe(SPLIT_PANES.FORM);
  });

  it("waits for the form pane to be mounted before moving the focus", () => {
    // Opening the split from the grid flips `isDualPane` one render before the
    // record reaches the store and the form pane exists.
    const { rerenderWith } = renderHarness();

    act(() => rerenderWith({ isDualPane: true, shouldShowForm: false }));
    expect(document.activeElement).toBe(document.body);

    act(() => rerenderWith(OPEN_SPLIT));
    expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.FORM_PANE));
  });

  it("leaves the caret alone when the focus is already inside the form pane", () => {
    // ctrl+m from the maximized form: blurring the field would fire its callout.
    const { rerenderWith } = renderHarness({ shouldShowForm: true });
    focusElement(TEST_IDS.FORM_INPUT);

    act(() => rerenderWith(OPEN_SPLIT));

    expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.FORM_INPUT));
  });

  it("does not steal the focus for a tab that does not own it", () => {
    const { rerenderWith } = renderHarness({ isTabFocused: false });

    act(() => rerenderWith(OPEN_SPLIT));

    expect(document.activeElement).toBe(document.body);
  });

  it("does not move the focus again when the panes stay on screen", () => {
    const { rerenderWith } = renderHarness();
    act(() => rerenderWith(OPEN_SPLIT));
    focusElement(TEST_IDS.FORM_INPUT_LAST);

    act(() => rerenderWith({ ...OPEN_SPLIT, hasGridFocusTarget: false }));

    expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.FORM_INPUT_LAST));
  });

  it("follows the DOM focus into the grid pane", () => {
    const { rerenderWith } = renderHarness();
    act(() => rerenderWith(OPEN_SPLIT));

    focusElement(TEST_IDS.GRID_TARGET);

    expect(focusedPaneText()).toBe(SPLIT_PANES.GRID);
  });

  it("does not re-render while the focus moves inside the same pane", () => {
    const onRender = jest.fn();
    const { rerenderWith } = renderHarness({ onRender });
    act(() => rerenderWith(OPEN_SPLIT));
    const rendersAfterOpening = onRender.mock.calls.length;

    focusElement(TEST_IDS.FORM_INPUT);
    focusElement(TEST_IDS.FORM_INPUT_LAST);

    expect(onRender).toHaveBeenCalledTimes(rendersAfterOpening);
  });

  describe("F6", () => {
    it("alternates the focus between the two panes", () => {
      const { rerenderWith } = renderHarness();
      act(() => rerenderWith(OPEN_SPLIT));

      pressNextPane();

      // The grid hands the focus to its marked target, where the row arrows live.
      expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.GRID_TARGET));
      expect(focusedPaneText()).toBe(SPLIT_PANES.GRID);

      pressNextPane();

      expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.FORM_PANE));
      expect(focusedPaneText()).toBe(SPLIT_PANES.FORM);
    });

    it("falls back to the pane container when it declares no target", () => {
      const { rerenderWith } = renderHarness({ hasGridFocusTarget: false });
      act(() => rerenderWith({ ...OPEN_SPLIT, hasGridFocusTarget: false }));

      pressNextPane();

      expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.GRID_PANE));
    });

    it("is inert while a single pane is on screen", () => {
      renderHarness({ shouldShowForm: true });

      pressNextPane();

      expect(document.activeElement).toBe(document.body);
    });

    it("is inert for a tab that does not own the focus", () => {
      const { rerenderWith } = renderHarness({ isTabFocused: false });
      act(() => rerenderWith({ ...OPEN_SPLIT, isTabFocused: false }));

      pressNextPane();

      expect(document.activeElement).toBe(document.body);
    });
  });
});

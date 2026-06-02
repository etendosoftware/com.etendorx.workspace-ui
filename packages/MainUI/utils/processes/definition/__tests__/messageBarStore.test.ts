import { getMessageBarState, type MessageBarState, messageBar, subscribeMessageBar } from "../messageBarStore";

describe("messageBarStore", () => {
  afterEach(() => {
    messageBar.hide();
  });

  /** The current state, asserting one exists (narrows away `null`). */
  const currentState = (): MessageBarState => {
    const state = getMessageBarState();
    if (!state) throw new Error("expected a message-bar state");
    return state;
  };

  it("starts empty", () => {
    expect(getMessageBarState()).toBeNull();
  });

  it("setMessage stores a sanitized, severity-normalized message", () => {
    messageBar.setMessage("ERROR", "Title", "body <b>x</b><script>bad()</script>");
    const state = currentState();
    expect(state.severity).toBe("error");
    expect(state.title).toBe("Title");
    expect(state.html).toBe("body <b>x</b>");
    expect(state.actions).toEqual([]);
  });

  it("falls back to info for unknown severities", () => {
    messageBar.setMessage("bogus", null, "x");
    expect(currentState().severity).toBe("info");
  });

  it("setMessage replaces the previous message", () => {
    messageBar.setMessage("info", null, "first");
    messageBar.setMessage("warning", null, "second");
    const state = currentState();
    expect(state.severity).toBe("warning");
    expect(state.html).toBe("second");
  });

  it("hide clears the message", () => {
    messageBar.setMessage("info", null, "x");
    messageBar.hide();
    expect(getMessageBarState()).toBeNull();
  });

  it("preserves actions", () => {
    const onClick = jest.fn();
    messageBar.setMessage("info", null, "x", [{ label: "OK", onClick }]);
    expect(currentState().actions).toHaveLength(1);
    currentState().actions[0].onClick();
    expect(onClick).toHaveBeenCalled();
  });

  it("notifies subscribers on change", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeMessageBar(listener);
    messageBar.setMessage("info", null, "x");
    expect(listener).toHaveBeenCalledTimes(1);
    messageBar.hide();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    messageBar.setMessage("info", null, "y");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

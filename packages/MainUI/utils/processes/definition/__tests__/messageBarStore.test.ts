import {
  getMessageBarState,
  MESSAGE_BAR_TYPES,
  type MessageBarState,
  messageBar,
  subscribeMessageBar,
  isolateMessageBar,
} from "../messageBarStore";

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

  it("MESSAGE_BAR_TYPES map to canonical severities", () => {
    expect(MESSAGE_BAR_TYPES).toEqual({
      TYPE_INFO: "info",
      TYPE_SUCCESS: "success",
      TYPE_WARNING: "warning",
      TYPE_ERROR: "error",
    });
  });

  it("setMessage accepts a MESSAGE_BAR_TYPES constant as severity", () => {
    messageBar.setMessage(MESSAGE_BAR_TYPES.TYPE_WARNING, null, "x");
    expect(currentState().severity).toBe("warning");
  });
});

describe("isolateMessageBar", () => {
  afterEach(() => messageBar.hide());

  it("gives the nested modal a clean bar and restores the launcher's message on close", () => {
    messageBar.setMessage("info", null, "Launcher message");

    const restore = isolateMessageBar();
    expect(getMessageBarState()).toBeNull();

    messageBar.setMessage("error", null, "Nested error");
    restore();

    expect(getMessageBarState()).toEqual(expect.objectContaining({ severity: "info", html: "Launcher message" }));
  });

  it("restores an empty bar when the launcher had no message", () => {
    const restore = isolateMessageBar();
    messageBar.setMessage("error", null, "Nested error");

    restore();

    expect(getMessageBarState()).toBeNull();
  });

  it("notifies the hosts on isolate and on restore", () => {
    messageBar.setMessage("info", null, "Launcher message");
    const listener = jest.fn();
    const unsubscribe = subscribeMessageBar(listener);

    const restore = isolateMessageBar();
    restore();
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(2);
  });
});

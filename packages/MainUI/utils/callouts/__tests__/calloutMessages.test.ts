import { showCalloutMessages } from "../calloutMessages";

describe("showCalloutMessages", () => {
  it("does nothing when messages is undefined", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages(undefined, showStatusModal);
    expect(showStatusModal).not.toHaveBeenCalled();
  });

  it("does nothing when messages is an empty array", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages([], showStatusModal);
    expect(showStatusModal).not.toHaveBeenCalled();
  });

  it.each([
    ["TYPE_INFO", "info"],
    ["TYPE_WARNING", "warning"],
    ["TYPE_SUCCESS", "success"],
    ["TYPE_ERROR", "error"],
    ["SOMETHING_ELSE", "info"],
  ])("maps severity %s to %s", (severity, expected) => {
    const showStatusModal = jest.fn();
    showCalloutMessages([{ text: "Message text", severity }], showStatusModal);
    expect(showStatusModal).toHaveBeenCalledWith(expected, "Message text");
  });

  it("shows every message in a multi-message response, in order", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages(
      [
        { text: "First", severity: "TYPE_WARNING" },
        { text: "Second", severity: "TYPE_SUCCESS" },
        { text: "Third", severity: "TYPE_ERROR" },
      ],
      showStatusModal
    );
    expect(showStatusModal).toHaveBeenCalledTimes(3);
    expect(showStatusModal).toHaveBeenNthCalledWith(1, "warning", "First");
    expect(showStatusModal).toHaveBeenNthCalledWith(2, "success", "Second");
    expect(showStatusModal).toHaveBeenNthCalledWith(3, "error", "Third");
  });

  it("skips messages without text", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages([{ text: "", severity: "TYPE_INFO" }], showStatusModal);
    expect(showStatusModal).not.toHaveBeenCalled();
  });
});

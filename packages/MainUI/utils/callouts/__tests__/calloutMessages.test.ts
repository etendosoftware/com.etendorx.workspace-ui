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

  it("maps TYPE_INFO to info", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages([{ text: "Info text", severity: "TYPE_INFO" }], showStatusModal);
    expect(showStatusModal).toHaveBeenCalledWith("info", "Info text");
  });

  it("maps TYPE_WARNING to warning", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages([{ text: "Warning text", severity: "TYPE_WARNING" }], showStatusModal);
    expect(showStatusModal).toHaveBeenCalledWith("warning", "Warning text");
  });

  it("maps TYPE_SUCCESS to success", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages([{ text: "Success text", severity: "TYPE_SUCCESS" }], showStatusModal);
    expect(showStatusModal).toHaveBeenCalledWith("success", "Success text");
  });

  it("maps TYPE_ERROR to error", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages([{ text: "Error text", severity: "TYPE_ERROR" }], showStatusModal);
    expect(showStatusModal).toHaveBeenCalledWith("error", "Error text");
  });

  it("falls back to info for an unknown or missing severity", () => {
    const showStatusModal = jest.fn();
    showCalloutMessages([{ text: "Unknown severity", severity: "SOMETHING_ELSE" }], showStatusModal);
    expect(showStatusModal).toHaveBeenCalledWith("info", "Unknown severity");
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

import { act, fireEvent, render, screen } from "@testing-library/react";
import ProcessMessageBar from "../ProcessMessageBar";
import { messageBar } from "@/utils/processes/definition/messageBarStore";

const LABELS: Record<string, string> = { "common.close": "Close" };

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => LABELS[key] ?? key }),
}));

describe("ProcessMessageBar", () => {
  afterEach(() => {
    act(() => {
      messageBar.hide();
    });
  });

  it("renders nothing when there is no message", () => {
    const { container } = render(<ProcessMessageBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title and sanitized body when a message is set", () => {
    render(<ProcessMessageBar />);
    act(() => {
      messageBar.setMessage("error", "Validation", "Amount is <b>invalid</b>");
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Validation")).toBeInTheDocument();
    expect(screen.getByText("invalid").tagName).toBe("B");
  });

  it("omits the title heading when title is null", () => {
    render(<ProcessMessageBar />);
    act(() => {
      messageBar.setMessage("info", null, "Body only");
    });
    expect(screen.getByText("Body only")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders actions as buttons and invokes their onClick", () => {
    const onClick = jest.fn();
    render(<ProcessMessageBar />);
    act(() => {
      messageBar.setMessage("info", null, "x", [{ label: "Never show again", onClick }]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Never show again" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("hides when the close button is clicked", () => {
    render(<ProcessMessageBar />);
    act(() => {
      messageBar.setMessage("warning", null, "Careful");
    });
    expect(screen.getByText("Careful")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears the message when unmounted", () => {
    const { unmount } = render(<ProcessMessageBar />);
    act(() => {
      messageBar.setMessage("info", null, "Pending");
    });
    unmount();
    expect(messageBar).toBeDefined();
    // Re-render a fresh host: the store was cleared on unmount, so nothing shows.
    render(<ProcessMessageBar />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

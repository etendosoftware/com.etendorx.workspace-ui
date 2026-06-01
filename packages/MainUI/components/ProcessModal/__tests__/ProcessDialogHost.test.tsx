import { act, fireEvent, render, screen } from "@testing-library/react";
import ProcessDialogHost from "../ProcessDialogHost";
import { clearDialogs, confirm, say } from "@/utils/processes/definition/dialogs";

const LABELS: Record<string, string> = {
  "common.confirm": "Confirm",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "process.warning": "Warning",
  "process.messageTitle": "Process",
};

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => LABELS[key] ?? key }),
}));

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

describe("ProcessDialogHost", () => {
  afterEach(async () => {
    await act(async () => {
      clearDialogs(false);
    });
  });

  it("renders nothing when there is no pending dialog", () => {
    const { container } = render(<ProcessDialogHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a confirm dialog and resolves true on accept", async () => {
    render(<ProcessDialogHost />);
    let promise!: Promise<boolean>;
    await act(async () => {
      promise = confirm("Are you sure?");
    });

    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    });
    await expect(promise).resolves.toBe(true);
  });

  it("resolves false on cancel", async () => {
    render(<ProcessDialogHost />);
    let promise!: Promise<boolean>;
    await act(async () => {
      promise = confirm("Are you sure?");
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });
    await expect(promise).resolves.toBe(false);
  });

  it("renders a single acknowledge button for say()", async () => {
    render(<ProcessDialogHost />);
    await act(async () => {
      say("Saved");
    });

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    // Single acknowledge button (the header "Close" X is separate).
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("resolves pending dialogs to false when unmounted", async () => {
    const { unmount } = render(<ProcessDialogHost />);
    let promise!: Promise<boolean>;
    await act(async () => {
      promise = confirm("Pending");
    });

    unmount();
    await expect(promise).resolves.toBe(false);
  });
});

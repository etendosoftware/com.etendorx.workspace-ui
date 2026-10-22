import { act, fireEvent, render, screen } from "@testing-library/react";
import ProcessStackHost from "../ProcessStackHost";
import { clearProcessStack, pushProcess } from "@/utils/processes/definition/processStack";

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

// Lightweight stub so the test renders only the host wiring, not the full modal
// (and its many providers). It surfaces processId and the close/success handlers.
jest.mock("../ProcessDefinitionModal", () => ({
  __esModule: true,
  default: ({
    button,
    onClose,
    onSuccess,
    callerField,
    ownerTab,
    contextRecord,
    externalParams,
    stackEntryId,
  }: {
    button: { processId: string };
    onClose: () => void;
    onSuccess?: () => void;
    callerField?: { id?: string; view?: unknown };
    ownerTab?: { id: string };
    contextRecord?: { id?: string };
    externalParams?: Record<string, unknown>;
    stackEntryId?: number;
  }) => (
    <div data-testid="modal-stub">
      <span data-testid="modal-owner">{`${ownerTab?.id ?? ""}|${contextRecord?.id ?? ""}`}</span>
      <span data-testid="modal-external">{JSON.stringify(externalParams ?? {})}</span>
      <span data-testid="modal-entry">{String(stackEntryId)}</span>
      <span data-testid="modal-process-id">{button.processId}</span>
      <span data-testid="modal-caller-field-id">{callerField?.id ?? ""}</span>
      <span data-testid="modal-caller-has-view">{callerField?.view ? "yes" : "no"}</span>
      <button type="button" onClick={onClose}>
        close
      </button>
      <button type="button" onClick={() => onSuccess?.()}>
        success
      </button>
    </div>
  ),
}));

const PROCESS_A = "PROCESS-A";
const PROCESS_B = "PROCESS-B";

describe("ProcessStackHost", () => {
  afterEach(async () => {
    await act(async () => {
      clearProcessStack();
    });
  });

  it("renders nothing when the stack is empty", () => {
    const { container } = render(<ProcessStackHost />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one modal per stack entry (stacked)", async () => {
    render(<ProcessStackHost />);
    await act(async () => {
      pushProcess({ processId: PROCESS_A });
      pushProcess({ processId: PROCESS_B });
    });

    const ids = screen.getAllByTestId("modal-process-id").map((node) => node.textContent);
    expect(ids).toEqual([PROCESS_A, PROCESS_B]);
  });

  it("pops the entry and fires its onClose when the modal closes", async () => {
    const onClose = jest.fn();
    render(<ProcessStackHost />);
    await act(async () => {
      pushProcess({ processId: PROCESS_A, onClose });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "close" }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("modal-stub")).not.toBeInTheDocument();
  });

  it("forwards the launcher callerField (with its view) to the nested modal", async () => {
    const launcherView = { windowId: "W-1" };
    render(<ProcessStackHost />);
    await act(async () => {
      pushProcess({
        processId: PROCESS_A,
        callerField: { id: "FIELD-1", view: launcherView },
      });
    });

    expect(screen.getByTestId("modal-caller-field-id").textContent).toBe("FIELD-1");
    expect(screen.getByTestId("modal-caller-has-view").textContent).toBe("yes");
  });

  it("pops the entry and fires only its onSuccess, once, on success", async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    render(<ProcessStackHost />);
    await act(async () => {
      pushProcess({ processId: PROCESS_A, onClose, onSuccess });
    });

    // A successful execution calls onSuccess and then onClose, as the modal does.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "success" }));
      fireEvent.click(screen.getByRole("button", { name: "close" }));
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId("modal-stub")).not.toBeInTheDocument();
  });

  it("does not fire onSuccess when the modal is closed without success", async () => {
    const onSuccess = jest.fn();
    render(<ProcessStackHost />);
    await act(async () => {
      pushProcess({ processId: PROCESS_A, onSuccess });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "close" }));
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("forwards the owner context, the externalParams and the stack entry id", async () => {
    render(<ProcessStackHost />);
    let entryId = 0;
    await act(async () => {
      entryId = pushProcess({
        processId: PROCESS_A,
        ownerTab: { id: "TAB-1" } as never,
        ownerRecord: { id: "REC-1" },
        externalParams: { bankStatementLineId: "BSL-1" },
      });
    });

    expect(screen.getByTestId("modal-owner").textContent).toBe("TAB-1|REC-1");
    expect(screen.getByTestId("modal-external").textContent).toBe('{"bankStatementLineId":"BSL-1"}');
    expect(screen.getByTestId("modal-entry").textContent).toBe(String(entryId));
  });
});

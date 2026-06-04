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
  }: {
    button: { processId: string };
    onClose: () => void;
    onSuccess?: () => void;
  }) => (
    <div data-testid="modal-stub">
      <span data-testid="modal-process-id">{button.processId}</span>
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

  it("pops the entry and fires its onClose on success", async () => {
    const onClose = jest.fn();
    render(<ProcessStackHost />);
    await act(async () => {
      pushProcess({ processId: PROCESS_A, onClose });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "success" }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("modal-stub")).not.toBeInTheDocument();
  });
});

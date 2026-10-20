/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type {
  ProcessExecution,
  ProcessExecutionDetail as Detail,
} from "@workspaceui/api-client/src/api/processMonitor";
import { fetchProcessMonitorDetail } from "@workspaceui/api-client/src/api/processMonitor";
import ProcessMonitorButton from "../ProcessMonitorButton";
import ProcessExecutionDetail from "../ProcessExecutionDetail";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import { notifyTransitions } from "@/utils/processMonitor/notifyTransitions";
import { PROCESS_MONITOR_WINDOW_ID, PROCESS_REQUEST_WINDOW_ID } from "@/utils/processMonitor/constants";

// The global manual mock renders IconButton as a plain <div>; the real button is needed here.
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () =>
  jest.requireActual("@workspaceui/componentlibrary/src/components/IconButton")
);
// The real Menu stays hidden until it measures its position.
jest.mock("@workspaceui/componentlibrary/src/components/Menu", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock("@workspaceui/componentlibrary/src/components/BasicModal", () => ({
  __esModule: true,
  default: ({ tittleHeader, children }: { tittleHeader?: string; children: React.ReactNode }) => (
    <dialog open aria-label={tittleHeader}>
      {children}
    </dialog>
  ),
}));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/hooks/useProcessMonitorPolling", () => ({ useProcessMonitorPolling: jest.fn() }));
jest.mock("@workspaceui/api-client/src/api/processMonitor", () => ({
  ...jest.requireActual("@workspaceui/api-client/src/api/processMonitor"),
  fetchProcessMonitorDetail: jest.fn(),
}));

const mockSetWindowActive = jest.fn();
const mockLoadWindowData = jest.fn().mockResolvedValue(undefined);
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) =>
    selector({ token: "jwt", currentRole: { id: "r1" }, passwordExpired: false }),
}));
jest.mock("@/stores/windowStore", () => ({
  useWindowStore: (selector: (s: unknown) => unknown) => selector({ setWindowActive: mockSetWindowActive }),
}));
jest.mock("@/stores/metadataStore", () => ({
  useMetadataZustandStore: (selector: (s: unknown) => unknown) => selector({ loadWindowData: mockLoadWindowData }),
}));

const mockFetchDetail = fetchProcessMonitorDetail as jest.Mock;

const build = (id: string, status: ProcessExecution["status"], updatedMs: number): ProcessExecution => ({
  id,
  processRequestId: null,
  processId: null,
  processName: `Process ${id}`,
  background: true,
  status,
  statusCode: "X",
  finished: status !== "RUNNING",
  startTime: null,
  endTime: null,
  durationMs: null,
  duration: null,
  updated: null,
  updatedMs,
});

const detailOf = (id: string, extra: Partial<Detail> = {}): Detail => ({
  ...build(id, "FAILED", 1),
  log: null,
  errorMessage: null,
  report: null,
  ...extra,
});

describe("ProcessMonitorButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProcessMonitorStore.getState().reset();
  });

  it("shows the running count badge and caps it at 99+", () => {
    useProcessMonitorStore.setState({ runningCount: 3 });
    const { rerender } = render(<ProcessMonitorButton />);
    expect(screen.getByTestId("process-monitor-running-badge")).toHaveTextContent("3");

    act(() => useProcessMonitorStore.setState({ runningCount: 150 }));
    rerender(<ProcessMonitorButton />);
    expect(screen.getByTestId("process-monitor-running-badge")).toHaveTextContent("99+");
  });

  it("shows no badge when nothing is running", () => {
    render(<ProcessMonitorButton />);
    expect(screen.queryByTestId("process-monitor-running-badge")).toBeNull();
  });

  it("renders nothing when the role has no access", () => {
    useProcessMonitorStore.setState({ forbidden: true });
    const { container } = render(<ProcessMonitorButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists the recent failures in the popover and opens the error detail on click", () => {
    mockFetchDetail.mockReturnValue(new Promise(() => {}));
    useProcessMonitorStore.setState({
      executions: { a: build("a", "FAILED", 2), b: build("b", "COMPLETED", 3) },
    });
    render(<ProcessMonitorButton />);
    fireEvent.click(screen.getByTestId("IconButton__process-monitor"));

    expect(screen.getByText("Process a")).toBeInTheDocument();
    expect(screen.queryByText("Process b")).toBeNull();

    fireEvent.click(screen.getByText("Process a"));
    expect(useProcessMonitorStore.getState().detailId).toBe("a");
  });

  it("lists the misfired runs with the failures, without treating them as failed", () => {
    useProcessMonitorStore.setState({
      executions: {
        m: { ...build("m", "OTHER", 2), statusCode: "MIS" },
        k: { ...build("k", "OTHER", 3), statusCode: "KIL" },
      },
    });
    render(<ProcessMonitorButton />);
    fireEvent.click(screen.getByTestId("IconButton__process-monitor"));

    expect(screen.getByText(/Process m/)).toHaveTextContent("processMonitor.misfired");
    expect(screen.queryByText(/Process k/)).toBeNull();
  });

  it("lists the running executions in their own section and opens the detail on click", () => {
    mockFetchDetail.mockReturnValue(new Promise(() => {}));
    useProcessMonitorStore.setState({
      executions: { r: build("r", "RUNNING", 2), a: build("a", "FAILED", 1) },
    });
    render(<ProcessMonitorButton />);
    fireEvent.click(screen.getByTestId("IconButton__process-monitor"));

    const section = screen.getByTestId("process-monitor-running");
    expect(section).toHaveTextContent("Process r");
    expect(section).not.toHaveTextContent("Process a");

    fireEvent.click(screen.getByText("Process r"));
    expect(useProcessMonitorStore.getState().detailId).toBe("r");
  });

  it("hides the running section when nothing is running", () => {
    render(<ProcessMonitorButton />);
    fireEvent.click(screen.getByTestId("IconButton__process-monitor"));
    expect(screen.queryByTestId("process-monitor-running")).toBeNull();
  });

  it("shows the empty state and the stale warning", () => {
    useProcessMonitorStore.setState({ hasError: true });
    render(<ProcessMonitorButton />);
    fireEvent.click(screen.getByTestId("IconButton__process-monitor"));

    expect(screen.getByText("processMonitor.noFailures")).toBeInTheDocument();
    expect(screen.getByText("processMonitor.staleWarning")).toBeInTheDocument();
  });

  it.each([
    ["processMonitor.requestWindow", PROCESS_REQUEST_WINDOW_ID],
    ["processMonitor.monitorWindow", PROCESS_MONITOR_WINDOW_ID],
  ])("opens the window behind the %s link", (label, windowId) => {
    render(<ProcessMonitorButton />);
    fireEvent.click(screen.getByTestId("IconButton__process-monitor"));
    fireEvent.click(screen.getByRole("button", { name: label }));

    expect(mockLoadWindowData).toHaveBeenCalledWith(windowId);
    expect(mockSetWindowActive).toHaveBeenCalledWith({
      windowIdentifier: expect.stringMatching(new RegExp(`^${windowId}_\\d+$`)),
      windowData: { title: label, initialized: true },
    });
  });
});

describe("ProcessExecutionDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProcessMonitorStore.getState().reset();
  });

  it("renders nothing without a selected execution", () => {
    const { container } = render(<ProcessExecutionDetail />);
    expect(container).toBeEmptyDOMElement();
    expect(mockFetchDetail).not.toHaveBeenCalled();
  });

  it("shows the loading state, then the full error message", async () => {
    let resolve: (value: Detail) => void = () => {};
    mockFetchDetail.mockReturnValue(
      new Promise<Detail>((r) => {
        resolve = r;
      })
    );
    useProcessMonitorStore.setState({ detailId: "a", executions: { a: build("a", "FAILED", 1) } });
    render(<ProcessExecutionDetail />);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await act(async () => resolve(detailOf("a", { errorMessage: "boom\nstack" })));

    expect(screen.getByTestId("process-monitor-error-message").textContent).toBe("boom\nstack");
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("falls back to the log when there is no error message", async () => {
    mockFetchDetail.mockResolvedValue(detailOf("a", { log: "some log" }));
    useProcessMonitorStore.setState({ detailId: "a" });
    render(<ProcessExecutionDetail />);

    expect(await screen.findByText("some log")).toBeInTheDocument();
  });

  it("shows an error when the detail cannot be loaded", async () => {
    mockFetchDetail.mockRejectedValue(new Error("nope"));
    useProcessMonitorStore.setState({ detailId: "a" });
    render(<ProcessExecutionDetail />);

    expect(await screen.findByRole("alert")).toHaveTextContent("processMonitor.detailError");
  });

  it("does not flash the previous execution while the next one loads", async () => {
    mockFetchDetail.mockResolvedValueOnce(detailOf("a", { errorMessage: "error A" }));
    mockFetchDetail.mockReturnValueOnce(new Promise(() => {}));
    useProcessMonitorStore.setState({ detailId: "a" });
    render(<ProcessExecutionDetail />);
    await screen.findByText("error A");

    act(() => useProcessMonitorStore.getState().openDetail("b"));

    await waitFor(() => expect(screen.queryByText("error A")).toBeNull());
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("notifyTransitions", () => {
  it("toasts the failure with an action that opens the detail", () => {
    const openDetail = jest.fn();
    notifyTransitions([{ execution: build("a", "FAILED", 1), status: "FAILED" }], {
      t: (key: string) => (key === "processMonitor.toast.failed" ? 'Process "%0" failed' : key),
      openDetail,
    });

    const [message, options] = (toast.error as jest.Mock).mock.calls[0];
    expect(message).toBe('Process "Process a" failed');
    options.action.onClick();
    expect(openDetail).toHaveBeenCalledWith("a");
  });

  it("does not interpret $ patterns in the process name", () => {
    notifyTransitions([{ execution: { ...build("b", "FAILED", 1), processName: "A$&B" }, status: "FAILED" }], {
      t: (key: string) => (key === "processMonitor.toast.failed" ? "failed %0" : key),
      openDetail: jest.fn(),
    });

    expect((toast.error as jest.Mock).mock.calls.at(-1)[0]).toBe("failed A$&B");
  });
});

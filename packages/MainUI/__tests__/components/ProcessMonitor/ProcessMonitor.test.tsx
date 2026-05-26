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
 * All portions are Copyright © 2021-2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { BackgroundProcessItem } from "@workspaceui/api-client/src/api/types";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useBackgroundProcessMonitor", () => ({
  useBackgroundProcessMonitor: jest.fn(),
}));

jest.mock("@/contexts/window", () => ({
  useWindowContext: jest.fn(),
}));

jest.mock("@/utils/window/utils", () => ({
  getNewWindowIdentifier: jest.fn((id: string) => `${id}_test123`),
}));

jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    tooltip,
    ariaLabel,
    "data-testid": testId,
  }: {
    children?: unknown;
    onClick?: () => void;
    tooltip?: string;
    ariaLabel?: string;
    "data-testid"?: string;
  }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} title={tooltip} data-testid={testId}>
      {children}
    </button>
  ),
}));

jest.mock("@workspaceui/componentlibrary/src/assets/icons/clock.svg", () => ({
  __esModule: true,
  default: ({ "data-testid": testId }: { "data-testid"?: string }) => <svg data-testid={testId} />,
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { ProcessMonitorButton } from "@/components/ProcessMonitor/ProcessMonitorButton";
import { ProcessMonitorPanel } from "@/components/ProcessMonitor/ProcessMonitorPanel";
import { ProcessMonitorItem } from "@/components/ProcessMonitor/ProcessMonitorItem";
import { ProcessStatusBadge } from "@/components/ProcessMonitor/ProcessStatusBadge";
import { useBackgroundProcessMonitor } from "@/hooks/useBackgroundProcessMonitor";
import { useWindowContext } from "@/contexts/window";

// ── Helpers ────────────────────────────────────────────────────────────────

const makeItem = (overrides: Partial<BackgroundProcessItem> = {}): BackgroundProcessItem => ({
  pInstanceId: "pid-1",
  processName: "Test Process",
  status: "COMPLETED",
  startTime: new Date(Date.now() - 30_000).toISOString(),
  errorMsg: null,
  ...overrides,
});

const defaultPanelProps = {
  open: true,
  onClose: jest.fn(),
  items: [],
  loading: false,
  onRefresh: jest.fn(),
};

// ── ProcessStatusBadge ─────────────────────────────────────────────────────

describe("ProcessStatusBadge", () => {
  it.each([
    ["RUNNING", "processMonitor.status.RUNNING"],
    ["COMPLETED", "processMonitor.status.COMPLETED"],
    ["FAILED", "processMonitor.status.FAILED"],
  ] as const)("renders label key for status %s", (status, expectedKey) => {
    render(<ProcessStatusBadge status={status} />);
    expect(screen.getByText(expectedKey)).toBeInTheDocument();
  });

  it("renders spinner only for RUNNING status", () => {
    const { rerender } = render(<ProcessStatusBadge status="RUNNING" />);
    expect(document.querySelector('[data-testid="CircularProgress__961534"]')).toBeInTheDocument();

    rerender(<ProcessStatusBadge status="COMPLETED" />);
    expect(document.querySelector('[data-testid="CircularProgress__961534"]')).not.toBeInTheDocument();
  });

  it("uses correct testid per status", () => {
    const { rerender } = render(<ProcessStatusBadge status="RUNNING" />);
    expect(screen.getByTestId("ProcessStatusBadge__RUNNING")).toBeInTheDocument();

    rerender(<ProcessStatusBadge status="COMPLETED" />);
    expect(screen.getByTestId("ProcessStatusBadge__COMPLETED")).toBeInTheDocument();

    rerender(<ProcessStatusBadge status="FAILED" />);
    expect(screen.getByTestId("ProcessStatusBadge__FAILED")).toBeInTheDocument();
  });
});

// ── ProcessMonitorItem ─────────────────────────────────────────────────────

describe("ProcessMonitorItem", () => {
  it("renders process name and elapsed time", () => {
    render(<ProcessMonitorItem item={makeItem({ processName: "My Process" })} />);
    expect(screen.getByText("My Process")).toBeInTheDocument();
    // elapsed: ~30s → "30processMonitor.item.timeAgo.seconds"
    expect(screen.getByText(/processMonitor\.item\.timeAgo/)).toBeInTheDocument();
  });

  it("shows no expand toggle when errorMsg is null", () => {
    render(<ProcessMonitorItem item={makeItem({ errorMsg: null })} />);
    expect(screen.queryByTestId("ProcessMonitorItem__toggle__pid-1")).not.toBeInTheDocument();
  });

  it("shows expand toggle when errorMsg is present", () => {
    render(<ProcessMonitorItem item={makeItem({ errorMsg: "Something failed", pInstanceId: "pid-2" })} />);
    expect(screen.getByTestId("ProcessMonitorItem__toggle__pid-2")).toBeInTheDocument();
  });

  it("expands and collapses log on toggle click", async () => {
    const item = makeItem({ errorMsg: "Stack trace here", pInstanceId: "pid-3", status: "FAILED" });
    render(<ProcessMonitorItem item={item} />);

    // Log not visible initially
    expect(screen.queryByText("Stack trace here")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByTestId("ProcessMonitorItem__toggle__pid-3"));
    await waitFor(() => expect(screen.getByText("Stack trace here")).toBeInTheDocument());

    // Click to collapse
    fireEvent.click(screen.getByTestId("ProcessMonitorItem__toggle__pid-3"));
    await waitFor(() => expect(screen.queryByText("Stack trace here")).not.toBeInTheDocument());
  });

  it("formats elapsed time: minutes", () => {
    const startTime = new Date(Date.now() - 90_000).toISOString(); // 90s = 1min
    render(<ProcessMonitorItem item={makeItem({ startTime })} />);
    expect(screen.getByText(/1processMonitor\.item\.timeAgo\.minutes/)).toBeInTheDocument();
  });

  it("formats elapsed time: hours", () => {
    const startTime = new Date(Date.now() - 7_200_000).toISOString(); // 2h
    render(<ProcessMonitorItem item={makeItem({ startTime })} />);
    expect(screen.getByText(/2processMonitor\.item\.timeAgo\.hours/)).toBeInTheDocument();
  });
});

// ── ProcessMonitorPanel ────────────────────────────────────────────────────

describe("ProcessMonitorPanel", () => {
  const mockSetWindowActive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useWindowContext as jest.Mock).mockReturnValue({ setWindowActive: mockSetWindowActive });
  });

  it("renders panel title from translation key", () => {
    render(<ProcessMonitorPanel {...defaultPanelProps} />);
    expect(screen.getByText("processMonitor.title")).toBeInTheDocument();
  });

  it("renders all four tab labels", () => {
    render(<ProcessMonitorPanel {...defaultPanelProps} />);
    for (const key of [
      "processMonitor.tabs.all",
      "processMonitor.tabs.running",
      "processMonitor.tabs.completed",
      "processMonitor.tabs.failed",
    ]) {
      expect(screen.getByText(new RegExp(key))).toBeInTheDocument();
    }
  });

  it("renders 'Open Process Monitor' link", () => {
    render(<ProcessMonitorPanel {...defaultPanelProps} />);
    expect(screen.getByTestId("ProcessMonitorPanel__monitor-link")).toBeInTheDocument();
    expect(screen.getByTestId("ProcessMonitorPanel__monitor-link")).toHaveTextContent("processMonitor.goToMonitor");
  });

  it("does NOT render old 'scheduling-link' testid", () => {
    render(<ProcessMonitorPanel {...defaultPanelProps} />);
    expect(screen.queryByTestId("ProcessMonitorPanel__scheduling-link")).not.toBeInTheDocument();
  });

  it("shows empty state message when no items and not loading", () => {
    render(<ProcessMonitorPanel {...defaultPanelProps} items={[]} loading={false} />);
    expect(screen.getByText("processMonitor.empty.noProcesses")).toBeInTheDocument();
  });

  it("shows loading message when loading is true and no items", () => {
    render(<ProcessMonitorPanel {...defaultPanelProps} items={[]} loading={true} />);
    expect(screen.getByText("processMonitor.empty.loading")).toBeInTheDocument();
  });

  it("renders items when provided", () => {
    const items = [
      makeItem({ pInstanceId: "a", processName: "Process A" }),
      makeItem({ pInstanceId: "b", processName: "Process B", status: "RUNNING" }),
    ];
    render(<ProcessMonitorPanel {...defaultPanelProps} items={items} />);
    expect(screen.getByText("Process A")).toBeInTheDocument();
    expect(screen.getByText("Process B")).toBeInTheDocument();
  });

  it("filters items by tab", async () => {
    const items = [
      makeItem({ pInstanceId: "r", processName: "Running One", status: "RUNNING" }),
      makeItem({ pInstanceId: "c", processName: "Completed One", status: "COMPLETED" }),
    ];
    render(<ProcessMonitorPanel {...defaultPanelProps} items={items} />);

    // Both visible on ALL tab
    expect(screen.getByText("Running One")).toBeInTheDocument();
    expect(screen.getByText("Completed One")).toBeInTheDocument();

    // Click RUNNING tab
    fireEvent.click(screen.getByTestId("ProcessMonitorPanel__tab__RUNNING"));
    await waitFor(() => expect(screen.getByText("Running One")).toBeInTheDocument());
    expect(screen.queryByText("Completed One")).not.toBeInTheDocument();

    // Click COMPLETED tab
    fireEvent.click(screen.getByTestId("ProcessMonitorPanel__tab__COMPLETED"));
    await waitFor(() => expect(screen.getByText("Completed One")).toBeInTheDocument());
    expect(screen.queryByText("Running One")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();
    render(<ProcessMonitorPanel {...defaultPanelProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("ProcessMonitorPanel__close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onRefresh when refresh button is clicked", () => {
    const onRefresh = jest.fn();
    render(<ProcessMonitorPanel {...defaultPanelProps} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByTestId("ProcessMonitorPanel__refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("disables refresh button while loading", () => {
    render(<ProcessMonitorPanel {...defaultPanelProps} loading={true} />);
    expect(screen.getByTestId("ProcessMonitorPanel__refresh")).toBeDisabled();
  });

  it("opens Process Monitor window and closes panel when link is clicked", () => {
    const onClose = jest.fn();
    render(<ProcessMonitorPanel {...defaultPanelProps} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("ProcessMonitorPanel__monitor-link"));
    expect(mockSetWindowActive).toHaveBeenCalledWith(
      expect.objectContaining({
        windowIdentifier: expect.stringContaining("EF3E837705944F4DBF398D683D36ACE0"),
        windowData: expect.objectContaining({ initialized: true }),
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows tab counts correctly", () => {
    const items = [
      makeItem({ pInstanceId: "1", status: "RUNNING" }),
      makeItem({ pInstanceId: "2", status: "COMPLETED" }),
      makeItem({ pInstanceId: "3", status: "FAILED" }),
    ];
    render(<ProcessMonitorPanel {...defaultPanelProps} items={items} />);
    expect(screen.getByTestId("ProcessMonitorPanel__tab__ALL")).toHaveTextContent("3");
    expect(screen.getByTestId("ProcessMonitorPanel__tab__RUNNING")).toHaveTextContent("1");
    expect(screen.getByTestId("ProcessMonitorPanel__tab__COMPLETED")).toHaveTextContent("1");
    expect(screen.getByTestId("ProcessMonitorPanel__tab__FAILED")).toHaveTextContent("1");
  });
});

// ── ProcessMonitorButton ───────────────────────────────────────────────────

describe("ProcessMonitorButton", () => {
  const mockMonitor = useBackgroundProcessMonitor as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useWindowContext as jest.Mock).mockReturnValue({ setWindowActive: jest.fn() });
    mockMonitor.mockReturnValue({ items: [], loading: false, runningCount: 0, failedCount: 0, refresh: jest.fn() });
  });

  it("renders the clock button with translated tooltip and aria-label", () => {
    render(<ProcessMonitorButton />);
    const btn = screen.getByTestId("ProcessMonitorButton__trigger");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-label", "processMonitor.button.ariaLabel");
    expect(btn).toHaveAttribute("title", "processMonitor.button.tooltip");
  });

  it("does not show badge when no running or failed processes", () => {
    render(<ProcessMonitorButton />);
    expect(screen.queryByTestId("ProcessMonitorButton__badge")).not.toBeInTheDocument();
  });

  it("shows blue badge for running processes only", () => {
    mockMonitor.mockReturnValue({ items: [], loading: false, runningCount: 2, failedCount: 0, refresh: jest.fn() });
    render(<ProcessMonitorButton />);
    const badge = screen.getByTestId("ProcessMonitorButton__badge");
    expect(badge).toHaveTextContent("2");
    expect(badge).toHaveClass("bg-blue-500");
  });

  it("shows red badge when there are failed processes", () => {
    mockMonitor.mockReturnValue({ items: [], loading: false, runningCount: 1, failedCount: 3, refresh: jest.fn() });
    render(<ProcessMonitorButton />);
    const badge = screen.getByTestId("ProcessMonitorButton__badge");
    expect(badge).toHaveTextContent("4");
    expect(badge).toHaveClass("bg-red-500");
  });

  it("caps badge at 99+", () => {
    mockMonitor.mockReturnValue({ items: [], loading: false, runningCount: 50, failedCount: 60, refresh: jest.fn() });
    render(<ProcessMonitorButton />);
    expect(screen.getByTestId("ProcessMonitorButton__badge")).toHaveTextContent("99+");
  });

  it("opens the panel when button is clicked", async () => {
    render(<ProcessMonitorButton />);
    expect(screen.queryByTestId("ProcessMonitorPanel__drawer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("ProcessMonitorButton__trigger"));
    await waitFor(() => expect(screen.getByTestId("ProcessMonitorPanel__drawer")).toBeInTheDocument());
  });
});

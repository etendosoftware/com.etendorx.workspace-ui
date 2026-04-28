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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProcessIframeModal from "@/components/ProcessModal/Iframe";
import type { ProcessIframeModalOpenProps } from "@/components/ProcessModal/types";
import "@testing-library/jest-dom";

// Mocks
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockFetchProcessMessage = jest.fn();

jest.mock("@/hooks/useProcessMessage", () => ({
  useProcessMessage: () => ({
    fetchProcessMessage: mockFetchProcessMessage,
  }),
}));

describe("ProcessIframeModal", () => {
  const baseProps: ProcessIframeModalOpenProps = {
    isOpen: true,
    url: "https://example.com",
    onClose: jest.fn(),
    onProcessSuccess: jest.fn(),
    title: "Test Modal",
    tabId: "123",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchProcessMessage.mockImplementation(() =>
      Promise.resolve({
        type: "success",
        title: "Success",
        message: "Operation completed",
      })
    );
  });

  it("should not render if isOpen is false", () => {
    const { container } = render(<ProcessIframeModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders modal correctly with iframe", async () => {
    render(<ProcessIframeModal {...baseProps} />);
    const iframe = screen.getByTitle("common.processes");

    fireEvent.load(iframe);

    await waitFor(() => expect(screen.queryByText("common.loading")).not.toBeInTheDocument());

    expect(screen.getByRole("heading", { name: /test modal/i })).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<ProcessIframeModal {...baseProps} />);
    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("sets iframeLoading to false on iframe load", async () => {
    render(<ProcessIframeModal {...baseProps} />);
    const iframe = screen.getByTitle("common.processes");

    fireEvent.load(iframe);

    await waitFor(() => expect(screen.queryByText("common.loading")).not.toBeInTheDocument());
  });

  it("auto-closes and calls onProcessSuccess after the success message timer", async () => {
    jest.useFakeTimers();
    const onProcessSuccess = jest.fn();
    const onClose = jest.fn();
    mockFetchProcessMessage.mockResolvedValueOnce({
      type: "success",
      title: "Done",
      text: "Process completed",
    });

    try {
      render(<ProcessIframeModal {...baseProps} onProcessSuccess={onProcessSuccess} onClose={onClose} />);

      act(() => {
        window.postMessage({ action: "processOrder" }, "*");
      });

      await waitFor(() => expect(mockFetchProcessMessage).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByText("Process completed")).toBeInTheDocument());

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(onProcessSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("handles postMessage: closeModal", async () => {
    render(<ProcessIframeModal {...baseProps} />);

    act(() => {
      window.postMessage({ type: "fromIframe", action: "closeModal" }, "*");
    });

    await waitFor(() => {
      expect(baseProps.onClose).toHaveBeenCalled();
    });
  });

  it("handles postMessage: processOrder and calls fetchProcessMessage", async () => {
    mockFetchProcessMessage.mockResolvedValueOnce({
      type: "success",
      title: "Processed",
    });

    render(<ProcessIframeModal {...baseProps} />);

    act(() => {
      window.postMessage({ type: "fromIframe", action: "processOrder" }, "*");
    });

    await waitFor(() => {
      expect(mockFetchProcessMessage).toHaveBeenCalled();
    });
  });

  it("renders fallback message if url is empty", async () => {
    render(<ProcessIframeModal {...baseProps} url="" />);

    await waitFor(() => {
      expect(screen.queryByText("common.loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("common.noDataAvailable")).toBeInTheDocument();
  });

  it("returns null if isOpen is false (again for coverage)", () => {
    const { container } = render(<ProcessIframeModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("sets hasNavigated on second onLoad and calls onProcessSuccess on close", async () => {
    const onProcessSuccess = jest.fn();
    const onClose = jest.fn();
    render(<ProcessIframeModal {...baseProps} onProcessSuccess={onProcessSuccess} onClose={onClose} />);
    const iframe = screen.getByTitle("common.processes");

    // First load — initial render, must NOT set hasNavigated
    fireEvent.load(iframe);
    // Second load — URL navigation
    fireEvent.load(iframe);

    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);

    expect(onProcessSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does NOT call onProcessSuccess after only the initial onLoad", async () => {
    const onProcessSuccess = jest.fn();
    const onClose = jest.fn();
    render(<ProcessIframeModal {...baseProps} onProcessSuccess={onProcessSuccess} onClose={onClose} />);
    const iframe = screen.getByTitle("common.processes");

    // Only first load — initial render
    fireEvent.load(iframe);

    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);

    expect(onProcessSuccess).not.toHaveBeenCalled();
  });

  it("does NOT call onProcessSuccess when closing without any load or postMessage", () => {
    const onProcessSuccess = jest.fn();
    const onClose = jest.fn();
    render(<ProcessIframeModal {...baseProps} onProcessSuccess={onProcessSuccess} onClose={onClose} />);

    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);

    expect(onProcessSuccess).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onProcessSuccess via postMessage success path (existing behavior unchanged)", async () => {
    const onProcessSuccess = jest.fn();
    const onClose = jest.fn();
    mockFetchProcessMessage.mockResolvedValueOnce({
      type: "success",
      title: "Done",
    });
    render(<ProcessIframeModal {...baseProps} onProcessSuccess={onProcessSuccess} onClose={onClose} />);

    act(() => {
      window.postMessage({ action: "processOrder" }, "*");
    });

    await waitFor(() => expect(mockFetchProcessMessage).toHaveBeenCalled());

    act(() => {
      window.postMessage({ action: "closeModal" }, "*");
    });

    await waitFor(() => {
      expect(onProcessSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("fallback message and loading", () => {
    it("shows the processing loading text when waiting for the process message", async () => {
      mockFetchProcessMessage.mockResolvedValueOnce(null);
      render(<ProcessIframeModal {...baseProps} />);

      const iframe = screen.getByTitle("common.processes");
      fireEvent.load(iframe);
      await waitFor(() => expect(screen.queryByText("common.loading")).not.toBeInTheDocument());

      act(() => {
        window.postMessage({ action: "processOrder" }, "*");
      });

      await waitFor(() => expect(screen.getByText("process.processingMessage")).toBeInTheDocument());
    });

    it("shows fallback warning after timeout when no real message arrives", async () => {
      jest.useFakeTimers();
      mockFetchProcessMessage.mockResolvedValueOnce(null);
      try {
        render(<ProcessIframeModal {...baseProps} />);

        const iframe = screen.getByTitle("common.processes");
        fireEvent.load(iframe);

        act(() => {
          window.postMessage({ action: "processOrder" }, "*");
        });

        await waitFor(() => expect(mockFetchProcessMessage).toHaveBeenCalled());

        act(() => {
          jest.advanceTimersByTime(5000);
        });

        await waitFor(() => expect(screen.getByText("process.fallbackMessage.title")).toBeInTheDocument());
        expect(screen.getByText("process.fallbackMessage.text")).toBeInTheDocument();
        expect(screen.queryByText("process.processingMessage")).not.toBeInTheDocument();
      } finally {
        jest.useRealTimers();
      }
    });

    it("cancels fallback when showProcessMessage arrives before timeout", async () => {
      jest.useFakeTimers();
      mockFetchProcessMessage.mockResolvedValueOnce(null);
      try {
        render(<ProcessIframeModal {...baseProps} />);

        const iframe = screen.getByTitle("common.processes");
        fireEvent.load(iframe);

        act(() => {
          window.postMessage({ action: "processOrder" }, "*");
        });

        await waitFor(() => expect(mockFetchProcessMessage).toHaveBeenCalled());

        act(() => {
          window.postMessage(
            {
              action: "showProcessMessage",
              payload: { type: "success", title: "Real success", text: "Real text" },
            },
            "*"
          );
        });

        await waitFor(() => expect(screen.getByText("Real text")).toBeInTheDocument());

        act(() => {
          jest.advanceTimersByTime(10000);
        });

        expect(screen.queryByText("process.fallbackMessage.title")).not.toBeInTheDocument();
      } finally {
        jest.useRealTimers();
      }
    });

    it("does not auto-close when fallback warning is showing", async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      mockFetchProcessMessage.mockResolvedValueOnce(null);
      try {
        render(<ProcessIframeModal {...baseProps} onClose={onClose} />);

        const iframe = screen.getByTitle("common.processes");
        fireEvent.load(iframe);

        act(() => {
          window.postMessage({ action: "processOrder" }, "*");
        });

        await waitFor(() => expect(mockFetchProcessMessage).toHaveBeenCalled());

        act(() => {
          jest.advanceTimersByTime(5000);
        });

        await waitFor(() => expect(screen.getByText("process.fallbackMessage.title")).toBeInTheDocument());

        act(() => {
          window.postMessage({ action: "closeModal" }, "*");
        });

        // Run pending microtasks/macrotasks so any pending close would fire
        act(() => {
          jest.advanceTimersByTime(1000);
        });

        expect(onClose).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it("starts fallback countdown when iframeUnloaded arrives without a prior processOrder", async () => {
      jest.useFakeTimers();
      try {
        render(<ProcessIframeModal {...baseProps} />);

        const iframe = screen.getByTitle("common.processes");
        fireEvent.load(iframe);

        act(() => {
          window.postMessage({ action: "iframeUnloaded" }, "*");
        });

        await waitFor(() => expect(screen.getByText("process.processingMessage")).toBeInTheDocument());

        act(() => {
          jest.advanceTimersByTime(5000);
        });

        await waitFor(() => expect(screen.getByText("process.fallbackMessage.title")).toBeInTheDocument());
      } finally {
        jest.useRealTimers();
      }
    });

    it("treats an empty fetchProcessMessage response as 'no message' and shows fallback", async () => {
      jest.useFakeTimers();
      // Simulate the backend returning an empty payload — fetchProcessMessage
      // resolves to null (handled in useProcessMessage) so the timer keeps running.
      mockFetchProcessMessage.mockResolvedValueOnce(null);
      try {
        render(<ProcessIframeModal {...baseProps} />);

        const iframe = screen.getByTitle("common.processes");
        fireEvent.load(iframe);

        act(() => {
          window.postMessage({ action: "processOrder" }, "*");
        });

        await waitFor(() => expect(mockFetchProcessMessage).toHaveBeenCalled());
        await waitFor(() => expect(screen.getByText("process.processingMessage")).toBeInTheDocument());

        act(() => {
          jest.advanceTimersByTime(5000);
        });

        await waitFor(() => expect(screen.getByText("process.fallbackMessage.title")).toBeInTheDocument());
      } finally {
        jest.useRealTimers();
      }
    });

    it("does not restart the fallback timer when iframeUnloaded arrives mid-countdown", async () => {
      jest.useFakeTimers();
      mockFetchProcessMessage.mockResolvedValueOnce(null);
      try {
        render(<ProcessIframeModal {...baseProps} />);

        const iframe = screen.getByTitle("common.processes");
        fireEvent.load(iframe);

        act(() => {
          window.postMessage({ action: "processOrder" }, "*");
        });

        await waitFor(() => expect(mockFetchProcessMessage).toHaveBeenCalled());

        // Advance partway through the timer, then dispatch iframeUnloaded.
        act(() => {
          jest.advanceTimersByTime(3000);
        });
        act(() => {
          window.postMessage({ action: "iframeUnloaded" }, "*");
        });

        // Advance the remaining 2s — if the timer was restarted by iframeUnloaded
        // the fallback would NOT show yet. We expect it TO show.
        act(() => {
          jest.advanceTimersByTime(2000);
        });

        await waitFor(() => expect(screen.getByText("process.fallbackMessage.title")).toBeInTheDocument());
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

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

// Mock the enhanced GlobalCalloutManager FIRST, before any imports
const mockCalloutManager = {
  isCalloutRunning: jest.fn(() => false),
  on: jest.fn(),
  off: jest.fn(),
  executeCallout: jest.fn(() => Promise.resolve()),
  getState: jest.fn(() => ({
    isRunning: false,
    queueLength: 0,
    pendingCount: 0,
    isSuppressed: false,
  })),
};

jest.mock("@/services/callouts", () => ({
  globalCalloutManager: mockCalloutManager,
}));

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToolbarProvider, useToolbarContext } from "../ToolbarContext";

const TestComponent = () => {
  const { saveButtonState, setSaveButtonState } = useToolbarContext();

  return (
    <div>
      <div data-testid="callout-loading">{saveButtonState.isCalloutLoading ? "Loading" : "Not Loading"}</div>
      <div data-testid="validation-errors">{saveButtonState.hasValidationErrors ? "Has Errors" : "No Errors"}</div>
      <div data-testid="is-saving">{saveButtonState.isSaving ? "Saving" : "Not Saving"}</div>
      <button
        type="button"
        onClick={() => setSaveButtonState((prev) => ({ ...prev, isSaving: true }))}
        data-testid="trigger-save">
        Trigger Save
      </button>
    </div>
  );
};

describe("ToolbarContext Event-Based Integration", () => {
  let calloutStartCallback: (() => void) | undefined;
  let calloutEndCallback: (() => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock to default state
    mockCalloutManager.isCalloutRunning.mockReturnValue(false);

    // Capture the event listeners
    mockCalloutManager.on.mockImplementation((event: string, callback: () => void) => {
      if (event === "calloutStart") {
        calloutStartCallback = callback;
      } else if (event === "calloutEnd") {
        calloutEndCallback = callback;
      }
    });
  });

  afterEach(() => {
    calloutStartCallback = undefined;
    calloutEndCallback = undefined;
  });

  test("should subscribe to callout events on mount", () => {
    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    // Should subscribe to both calloutStart and calloutEnd events
    expect(mockCalloutManager.on).toHaveBeenCalledWith("calloutStart", expect.any(Function));
    expect(mockCalloutManager.on).toHaveBeenCalledWith("calloutEnd", expect.any(Function));
  });

  test("should respond to calloutStart events", async () => {
    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    expect(screen.getByTestId("callout-loading")).toHaveTextContent("Not Loading");

    // Simulate calloutStart event
    act(() => {
      calloutStartCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("callout-loading")).toHaveTextContent("Loading");
    });
  });

  test("should respond to calloutEnd events", async () => {
    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    // First trigger calloutStart
    act(() => {
      calloutStartCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("callout-loading")).toHaveTextContent("Loading");
    });

    // Then trigger calloutEnd
    act(() => {
      calloutEndCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("callout-loading")).toHaveTextContent("Not Loading");
    });
  });

  test("should cleanup event listeners on unmount", () => {
    const { unmount } = render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    // Clear the mock to track cleanup calls
    jest.clearAllMocks();

    unmount();

    // Should unsubscribe from both events
    expect(mockCalloutManager.off).toHaveBeenCalledWith("calloutStart", expect.any(Function));
    expect(mockCalloutManager.off).toHaveBeenCalledWith("calloutEnd", expect.any(Function));
  });

  test("should set initial state from callout manager", () => {
    mockCalloutManager.isCalloutRunning.mockReturnValue(true);

    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    expect(screen.getByTestId("callout-loading")).toHaveTextContent("Loading");
  });

  test("should maintain other toolbar functionality", async () => {
    const user = userEvent.setup();

    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    const triggerSaveButton = screen.getByTestId("trigger-save");

    expect(screen.getByTestId("is-saving")).toHaveTextContent("Not Saving");

    await user.click(triggerSaveButton);

    await waitFor(() => {
      expect(screen.getByTestId("is-saving")).toHaveTextContent("Saving");
    });
  });

  test("should handle multiple state updates correctly", async () => {
    render(
      <ToolbarProvider>
        <TestComponent />
      </ToolbarProvider>
    );

    // Initial state
    expect(screen.getByTestId("callout-loading")).toHaveTextContent("Not Loading");
    expect(screen.getByTestId("validation-errors")).toHaveTextContent("No Errors");
    expect(screen.getByTestId("is-saving")).toHaveTextContent("Not Saving");

    // Trigger callout loading
    act(() => {
      calloutStartCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("callout-loading")).toHaveTextContent("Loading");
    });

    // Should not affect other states
    expect(screen.getByTestId("validation-errors")).toHaveTextContent("No Errors");
    expect(screen.getByTestId("is-saving")).toHaveTextContent("Not Saving");

    // End callout loading
    act(() => {
      calloutEndCallback?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId("callout-loading")).toHaveTextContent("Not Loading");
    });
  });

  test("should provide saveButtonState and setSaveButtonState in context", () => {
    const TestContextComponent = () => {
      const context = useToolbarContext();

      // Verify context has the expected properties
      expect(context.saveButtonState).toBeDefined();
      expect(context.setSaveButtonState).toBeDefined();
      expect(typeof context.setSaveButtonState).toBe("function");

      return <div data-testid="context-test">Context OK</div>;
    };

    render(
      <ToolbarProvider>
        <TestContextComponent />
      </ToolbarProvider>
    );

    expect(screen.getByTestId("context-test")).toHaveTextContent("Context OK");
  });
});

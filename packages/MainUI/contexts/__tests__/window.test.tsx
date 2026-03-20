/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, WITHOUT WARRANTY OF ANY KIND,
 * SOFTWARE OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import React from "react";
import { render, screen, act } from "@testing-library/react";
import WindowProvider, { useWindowContext } from "../window";
import { useGlobalUrlStateRecovery } from "@/hooks/useGlobalUrlStateRecovery";
import { useRouter, useSearchParams } from "next/navigation";

// Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/hooks/useGlobalUrlStateRecovery", () => ({
  useGlobalUrlStateRecovery: jest.fn(),
}));

jest.mock("@/utils/window/utils", () => ({
  getWindowIdFromIdentifier: jest.fn((id) => id.split("_")[0]),
  ensureTabExists: jest.fn((state, winId, tabId) => {
    if (!state[winId]) state[winId] = { tabs: {} };
    if (!state[winId].tabs[tabId]) state[winId].tabs[tabId] = { table: {} };
    return state;
  }),
  updateTableProperty: jest.fn((state, winId, tabId, prop, value) => {
    state[winId].tabs[tabId].table[prop] = value;
    return { ...state };
  }),
}));

jest.mock("@/utils/url/utils", () => ({
  buildWindowsUrlParams: jest.fn(() => "mock-params"),
}));

const TestComponent = ({ onResult }: any) => {
  const context = useWindowContext();
  React.useEffect(() => {
    onResult(context);
  }, [context, onResult]);
  return null;
};

describe("WindowProvider", () => {
  const mockRouter = { replace: jest.fn() };
  const mockSearchParams = { toString: jest.fn(() => "") };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
      recoveredWindows: [],
      isRecoveryLoading: false,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });
  });

  it("should initialize with empty state", () => {
    render(<WindowProvider>TestContent</WindowProvider>);
    expect(screen.getByText("TestContent")).toBeInTheDocument();
  });

  it("should update state when recoveredWindows change", async () => {
    const recoveredWindows = [
      { windowIdentifier: "143_1", windowId: "143", isActive: true, tabs: {} }
    ];
    (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
      recoveredWindows,
      isRecoveryLoading: false,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });

    render(
      <WindowProvider>
        <TestComponent onResult={() => {}} />
      </WindowProvider>
    );
    
    await act(async () => {
      // Wait for effects
    });

    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("window?mock-params"));
  });

  it("should not sync to URL if isRecoveryLoading is true", async () => {
    (useGlobalUrlStateRecovery as jest.Mock).mockReturnValue({
      recoveredWindows: [{ windowIdentifier: "143_1" }],
      isRecoveryLoading: true,
      recoveryError: null,
      triggerRecovery: jest.fn(),
    });

    render(
      <WindowProvider>
        <TestComponent onResult={() => {}} />
      </WindowProvider>
    );

    await act(async () => {
      // Wait for effects
    });

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("should provide context methods to children", () => {
    const mockOnResult = jest.fn();
    render(
      <WindowProvider>
        <TestComponent onResult={mockOnResult} />
      </WindowProvider>
    );

    expect(mockOnResult).toHaveBeenCalledWith(expect.objectContaining({
      setWindowActive: expect.any(Function),
      getTableState: expect.any(Function),
    }));
  });
});

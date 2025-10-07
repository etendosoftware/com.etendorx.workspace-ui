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

import { render, act } from "@testing-library/react";
import { TabRefreshProvider, useTabRefreshContext } from "@/contexts/TabRefreshContext";
import { logger } from "@/utils/logger";

// Mock logger
jest.mock("@/utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("TabRefreshContext", () => {
  let contextValue: ReturnType<typeof useTabRefreshContext>;

  const TestComponent = () => {
    contextValue = useTabRefreshContext();
    return null;
  };

  const renderWithProvider = () => {
    render(
      <TabRefreshProvider>
        <TestComponent />
      </TabRefreshProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerRefresh and unregisterRefresh", () => {
    it("should register and unregister refresh callbacks", () => {
      renderWithProvider();

      const mockRefresh = jest.fn();

      act(() => {
        contextValue.registerRefresh(1, mockRefresh);
      });

      expect(logger.debug).toHaveBeenCalledWith("TabRefreshContext: Registered refresh for level 1");

      act(() => {
        contextValue.unregisterRefresh(1);
      });

      expect(logger.debug).toHaveBeenCalledWith("TabRefreshContext: Unregistered refresh for level 1");
    });
  });

  describe("triggerParentRefreshes", () => {
    it("should not trigger refreshes for level 0", async () => {
      renderWithProvider();

      await act(async () => {
        await contextValue.triggerParentRefreshes(0);
      });

      expect(logger.debug).toHaveBeenCalledWith("TabRefreshContext: No parent levels to refresh");
    });

    it("should trigger parent refreshes sequentially from level-1 to 0", async () => {
      renderWithProvider();

      const mockRefresh0 = jest.fn().mockResolvedValue(undefined);
      const mockRefresh1 = jest.fn().mockResolvedValue(undefined);

      act(() => {
        contextValue.registerRefresh(0, mockRefresh0);
        contextValue.registerRefresh(1, mockRefresh1);
      });

      await act(async () => {
        await contextValue.triggerParentRefreshes(2);
      });

      // Should call level 1 first, then level 0
      expect(mockRefresh1).toHaveBeenCalledTimes(1);
      expect(mockRefresh0).toHaveBeenCalledTimes(1);

      // Verify order: level 1 called before level 0 by checking call order
      const refresh1CallOrder = mockRefresh1.mock.invocationCallOrder[0];
      const refresh0CallOrder = mockRefresh0.mock.invocationCallOrder[0];
      expect(refresh1CallOrder).toBeLessThan(refresh0CallOrder);
    });

    it("should continue refreshing other levels if one fails", async () => {
      renderWithProvider();

      const mockRefresh0 = jest.fn().mockResolvedValue(undefined);
      const mockRefresh1 = jest.fn().mockRejectedValue(new Error("Refresh failed"));

      act(() => {
        contextValue.registerRefresh(0, mockRefresh0);
        contextValue.registerRefresh(1, mockRefresh1);
      });

      await act(async () => {
        await contextValue.triggerParentRefreshes(2);
      });

      expect(mockRefresh1).toHaveBeenCalledTimes(1);
      expect(mockRefresh0).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        "TabRefreshContext: Failed to refresh parent tab at level 1:",
        expect.any(Error)
      );
    });

    it("should handle missing refresh callbacks gracefully", async () => {
      renderWithProvider();

      const mockRefresh0 = jest.fn().mockResolvedValue(undefined);

      act(() => {
        contextValue.registerRefresh(0, mockRefresh0);
        // Level 1 not registered
      });

      await act(async () => {
        await contextValue.triggerParentRefreshes(2);
      });

      expect(mockRefresh0).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith("TabRefreshContext: No refresh callback found for level 1");
    });
  });
});

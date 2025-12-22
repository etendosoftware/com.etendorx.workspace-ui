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
import { REFRESH_TYPES } from "@/utils/toolbar/constants";

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
    it("should register and unregister refresh callbacks with type", () => {
      renderWithProvider();

      const mockRefresh = jest.fn();

      act(() => {
        contextValue.registerRefresh(1, REFRESH_TYPES.TABLE, mockRefresh);
      });

      expect(logger.debug).toHaveBeenCalledWith(
        `TabRefreshContext: Registered ${REFRESH_TYPES.TABLE} refresh for level 1`
      );

      act(() => {
        contextValue.unregisterRefresh(1);
      });

      expect(logger.debug).toHaveBeenCalledWith("TabRefreshContext: Unregistered all refreshes for level 1");
    });

    it("should allow registering multiple types for the same level", () => {
      renderWithProvider();

      const mockTableRefresh = jest.fn();
      const mockFormRefresh = jest.fn();

      act(() => {
        contextValue.registerRefresh(1, REFRESH_TYPES.TABLE, mockTableRefresh);
        contextValue.registerRefresh(1, REFRESH_TYPES.FORM, mockFormRefresh);
      });

      expect(logger.debug).toHaveBeenCalledWith(
        `TabRefreshContext: Registered ${REFRESH_TYPES.TABLE} refresh for level 1`
      );
      expect(logger.debug).toHaveBeenCalledWith(
        `TabRefreshContext: Registered ${REFRESH_TYPES.FORM} refresh for level 1`
      );
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

    it("should trigger all types of refreshes for parent levels sequentially", async () => {
      renderWithProvider();

      const mockTableRefresh0 = jest.fn().mockResolvedValue(undefined);
      const mockFormRefresh0 = jest.fn().mockResolvedValue(undefined);
      const mockTableRefresh1 = jest.fn().mockResolvedValue(undefined);

      act(() => {
        contextValue.registerRefresh(0, REFRESH_TYPES.TABLE, mockTableRefresh0);
        contextValue.registerRefresh(0, REFRESH_TYPES.FORM, mockFormRefresh0);
        contextValue.registerRefresh(1, REFRESH_TYPES.TABLE, mockTableRefresh1);
      });

      await act(async () => {
        await contextValue.triggerParentRefreshes(2);
      });

      // Should call all registered refreshes for level 1, then level 0
      expect(mockTableRefresh1).toHaveBeenCalledTimes(1);
      expect(mockTableRefresh0).toHaveBeenCalledTimes(1);
      expect(mockFormRefresh0).toHaveBeenCalledTimes(1);
    });

    it("should continue refreshing other levels if one fails", async () => {
      renderWithProvider();

      const mockRefresh0 = jest.fn().mockResolvedValue(undefined);
      const mockRefresh1 = jest.fn().mockRejectedValue(new Error("Refresh failed"));

      act(() => {
        contextValue.registerRefresh(0, REFRESH_TYPES.TABLE, mockRefresh0);
        contextValue.registerRefresh(1, REFRESH_TYPES.TABLE, mockRefresh1);
      });

      await act(async () => {
        await contextValue.triggerParentRefreshes(2);
      });

      expect(mockRefresh1).toHaveBeenCalledTimes(1);
      expect(mockRefresh0).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith(
        `TabRefreshContext: Failed to execute ${REFRESH_TYPES.TABLE} refresh at level 1:`,
        expect.any(Error)
      );
    });

    it("should handle missing refresh callbacks gracefully", async () => {
      renderWithProvider();

      const mockRefresh0 = jest.fn().mockResolvedValue(undefined);

      act(() => {
        contextValue.registerRefresh(0, REFRESH_TYPES.TABLE, mockRefresh0);
        // Level 1 not registered
      });

      await act(async () => {
        await contextValue.triggerParentRefreshes(2);
      });

      expect(mockRefresh0).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalledWith("TabRefreshContext: No refresh callbacks found for level 1");
    });
  });

  describe("triggerRefresh", () => {
    it("should trigger only the specified type for the given level", async () => {
      renderWithProvider();

      const mockTableRefresh = jest.fn().mockResolvedValue(undefined);
      const mockFormRefresh = jest.fn().mockResolvedValue(undefined);

      act(() => {
        contextValue.registerRefresh(1, REFRESH_TYPES.TABLE, mockTableRefresh);
        contextValue.registerRefresh(1, REFRESH_TYPES.FORM, mockFormRefresh);
      });

      await act(async () => {
        await contextValue.triggerRefresh(1, REFRESH_TYPES.TABLE);
      });

      expect(mockTableRefresh).toHaveBeenCalledTimes(1);
      expect(mockFormRefresh).not.toHaveBeenCalled();
    });

    it("should handle missing refresh callback for specific type gracefully", async () => {
      renderWithProvider();

      await act(async () => {
        await contextValue.triggerRefresh(1, REFRESH_TYPES.TABLE);
      });

      expect(logger.debug).toHaveBeenCalledWith(
        `TabRefreshContext: No ${REFRESH_TYPES.TABLE} refresh callback found for level 1`
      );
    });

    it("should log error if triggerRefresh fails", async () => {
      renderWithProvider();

      const mockFailingRefresh = jest.fn().mockRejectedValue(new Error("Trigger failed"));

      act(() => {
        contextValue.registerRefresh(1, REFRESH_TYPES.TABLE, mockFailingRefresh);
      });

      await act(async () => {
        await contextValue.triggerRefresh(1, REFRESH_TYPES.TABLE);
      });

      expect(logger.warn).toHaveBeenCalledWith(
        `TabRefreshContext: Failed to trigger ${REFRESH_TYPES.TABLE} refresh at level 1:`,
        expect.any(Error)
      );
    });
  });

  describe("triggerCurrentRefresh", () => {
    it("should trigger all types for the current level", async () => {
      renderWithProvider();

      const mockTableRefresh = jest.fn().mockResolvedValue(undefined);
      const mockFormRefresh = jest.fn().mockResolvedValue(undefined);

      act(() => {
        contextValue.registerRefresh(1, REFRESH_TYPES.TABLE, mockTableRefresh);
        contextValue.registerRefresh(1, REFRESH_TYPES.FORM, mockFormRefresh);
      });

      await act(async () => {
        await contextValue.triggerCurrentRefresh(1);
      });

      expect(mockTableRefresh).toHaveBeenCalledTimes(1);
      expect(mockFormRefresh).toHaveBeenCalledTimes(1);
    });
  });
});

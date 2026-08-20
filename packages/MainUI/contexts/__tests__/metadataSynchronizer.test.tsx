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

import { render, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { WINDOW_NOT_FOUND_ERROR_MESSAGE, WindowAccessDeniedError } from "@workspaceui/api-client/src/api/errors";
import { MetadataSynchronizer } from "@/contexts/metadata";
import { useWindowStore } from "@/stores/windowStore";

const WINDOW_ID = "102";
const WINDOW_IDENTIFIER = "102_1787227156318";

const cleanupWindow = jest.fn();
const loadWindowData = jest.fn();

jest.mock("sonner", () => ({ toast: { warning: jest.fn() } }));

jest.mock("@/contexts/datasourceContext", () => ({
  useDatasourceContext: () => ({ removeRecordFromDatasource: jest.fn() }),
}));

jest.mock("@/contexts/metadataStore", () => ({
  useMetadataStore: () => ({
    loadWindowData,
    isWindowLoading: () => false,
    windowsData: {},
  }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("MetadataSynchronizer", () => {
  const realCleanupWindow = useWindowStore.getState().cleanupWindow;

  beforeEach(() => {
    jest.clearAllMocks();
    useWindowStore.setState({
      windows: {
        [WINDOW_IDENTIFIER]: { windowId: WINDOW_ID, windowIdentifier: WINDOW_IDENTIFIER, isActive: true } as never,
      },
      dirtyWindows: {},
      accessDeniedWindowCount: 0,
      cleanupWindow,
    });
  });

  it("closes the window and warns when other windows are still open", async () => {
    loadWindowData.mockRejectedValue(new WindowAccessDeniedError(WINDOW_ID, 401));

    render(<MetadataSynchronizer />);

    await waitFor(() => expect(cleanupWindow).toHaveBeenCalledWith(WINDOW_IDENTIFIER));
    // The mocked cleanupWindow does not remove the window, so one is still counted as remaining.
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(useWindowStore.getState().accessDeniedWindowCount).toBe(0);
  });

  it("requests the full-screen view when it was the last open window", async () => {
    // Restore the real action so the window is actually removed before the report is built.
    useWindowStore.setState({ cleanupWindow: realCleanupWindow });
    loadWindowData.mockRejectedValue(new WindowAccessDeniedError(WINDOW_ID, 401));

    render(<MetadataSynchronizer />);

    await waitFor(() => expect(useWindowStore.getState().accessDeniedWindowCount).toBe(1));
    expect(useWindowStore.getState().windows).toEqual({});
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("keeps closing silently the windows that no longer exist", async () => {
    loadWindowData.mockRejectedValue(new Error(WINDOW_NOT_FOUND_ERROR_MESSAGE));

    render(<MetadataSynchronizer />);

    await waitFor(() => expect(cleanupWindow).toHaveBeenCalledWith(WINDOW_IDENTIFIER));
    expect(toast.warning).not.toHaveBeenCalled();
    expect(useWindowStore.getState().accessDeniedWindowCount).toBe(0);
  });

  it("leaves any other failure untouched", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    loadWindowData.mockRejectedValue(new Error("boom"));

    render(<MetadataSynchronizer />);

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    expect(cleanupWindow).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

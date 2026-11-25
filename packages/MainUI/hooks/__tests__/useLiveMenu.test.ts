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

import { renderHook, waitFor } from "@testing-library/react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useUserStore } from "@/stores/userStore";
import { logger } from "@/utils/logger";
import { useLiveMenu } from "../useLiveMenu";

jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { getCachedMenu: jest.fn(), getMenu: jest.fn() },
}));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn() } }));

const CACHED_MENU = [{ id: "CACHED", name: "Cached", type: "Window" }];
const LOADED_MENU = [{ id: "LOADED", name: "Loaded", type: "Window" }];

const setRole = (id?: string) =>
  useUserStore.setState({ currentRole: id ? ({ id } as never) : undefined } as Partial<
    ReturnType<typeof useUserStore.getState>
  >);

describe("useLiveMenu (ETP-6431)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Metadata.getCachedMenu).mockReturnValue(CACHED_MENU as never);
  });

  it("starts with the cached menu and asks nothing while there is no role", () => {
    setRole(undefined);
    const { result } = renderHook(() => useLiveMenu());

    expect(result.current).toBe(CACHED_MENU);
    expect(Metadata.getMenu).not.toHaveBeenCalled();
  });

  it("takes the menu of the current role", async () => {
    setRole("ROLE");
    jest.mocked(Metadata.getMenu).mockResolvedValue(LOADED_MENU as never);
    const { result } = renderHook(() => useLiveMenu());

    await waitFor(() => expect(result.current).toBe(LOADED_MENU));
    expect(Metadata.getMenu).toHaveBeenCalledWith();
  });

  it("keeps the cached menu when the menu cannot be loaded", async () => {
    setRole("ROLE");
    jest.mocked(Metadata.getMenu).mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useLiveMenu());

    await waitFor(() => expect(logger.warn).toHaveBeenCalled());
    expect(result.current).toBe(CACHED_MENU);
  });

  it("ignores a menu that arrives after unmounting", async () => {
    setRole("ROLE");
    let resolveMenu: (menu: unknown) => void = () => undefined;
    jest.mocked(Metadata.getMenu).mockReturnValue(new Promise((resolve) => (resolveMenu = resolve)) as never);
    const { result, unmount } = renderHook(() => useLiveMenu());

    unmount();
    resolveMenu(LOADED_MENU);
    await Promise.resolve();

    expect(result.current).toBe(CACHED_MENU);
  });
});

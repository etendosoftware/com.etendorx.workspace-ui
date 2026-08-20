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

import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { useStatusModal } from "../useStatusModal";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

const mockToastError = toast.error as jest.Mock;

describe("useStatusModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("makes the toast persistent and forwards onReload/reloadLabel when onReload is provided", () => {
    const onReload = jest.fn();
    const { result } = renderHook(() => useStatusModal());

    result.current.showErrorModal("Conflict detected", { onReload, reloadLabel: "Reload" });

    expect(mockToastError).toHaveBeenCalledTimes(1);
    const [titleNode, toastOptions] = mockToastError.mock.calls[0];

    expect(toastOptions.duration).toBe(Number.POSITIVE_INFINITY);
    expect(titleNode.props.onReload).toBe(onReload);
    expect(titleNode.props.reloadLabel).toBe("Reload");
  });

  it("keeps the default auto-dismiss duration and no reload action for a plain error", () => {
    const { result } = renderHook(() => useStatusModal());

    result.current.showErrorModal("Something went wrong");

    expect(mockToastError).toHaveBeenCalledTimes(1);
    const [titleNode, toastOptions] = mockToastError.mock.calls[0];

    expect(toastOptions.duration).toBe(4000);
    expect(titleNode.props.onReload).toBeUndefined();
  });
});

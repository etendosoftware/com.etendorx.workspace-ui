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

import { act, render } from "@testing-library/react";
import { GlobalErrorHandlers, NETWORK_ERROR_TOAST_ID, OFFLINE_TOAST_ID } from "../GlobalErrorHandlers";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const toastError = jest.fn();
const toastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
  },
}));

const dispatchRejection = (reason: unknown) => {
  const event = new Event("unhandledrejection") as Event & { reason: unknown };
  event.reason = reason;
  act(() => {
    window.dispatchEvent(event);
  });
};

describe("GlobalErrorHandlers", () => {
  beforeEach(() => {
    toastError.mockClear();
    toastSuccess.mockClear();
    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
  });

  it("shows a persistent offline notice when the connection is lost", () => {
    render(<GlobalErrorHandlers />);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(toastError).toHaveBeenCalledWith(
      "errors.connection.offlineTitle",
      expect.objectContaining({ id: OFFLINE_TOAST_ID, duration: Number.POSITIVE_INFINITY })
    );
  });

  it("updates the offline notice in place with a restored message when the connection returns", () => {
    render(<GlobalErrorHandlers />);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(toastSuccess).toHaveBeenCalledWith(
      "errors.connection.backOnlineTitle",
      expect.objectContaining({ id: OFFLINE_TOAST_ID, duration: 4000 })
    );
  });

  it("shows an actionable message for an unhandled network failure", () => {
    render(<GlobalErrorHandlers />);

    dispatchRejection(new TypeError("Failed to fetch"));

    expect(toastError).toHaveBeenCalledWith(
      "errors.networkError.title",
      expect.objectContaining({ id: NETWORK_ERROR_TOAST_ID, description: "errors.networkError.description" })
    );
  });

  it("shows a timeout message for an unhandled timeout", () => {
    render(<GlobalErrorHandlers />);

    dispatchRejection(new DOMException("signal timed out", "TimeoutError"));

    expect(toastError).toHaveBeenCalledWith(
      "errors.connection.timeoutTitle",
      expect.objectContaining({ id: NETWORK_ERROR_TOAST_ID })
    );
  });

  it("stays silent for intentional aborts and unrelated errors", () => {
    render(<GlobalErrorHandlers />);

    dispatchRejection(new DOMException("aborted", "AbortError"));
    dispatchRejection(new Error("Validation failed"));

    expect(toastError).not.toHaveBeenCalled();
  });

  it("does not add a network toast while offline, since the offline notice already covers it", () => {
    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    render(<GlobalErrorHandlers />);

    dispatchRejection(new TypeError("Failed to fetch"));

    expect(toastError).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", () => {
    const { unmount } = render(<GlobalErrorHandlers />);
    unmount();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(toastError).not.toHaveBeenCalled();
  });
});

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
import { useProcessButton } from "../useProcessButton";
import { LegacyProcessUnresolvedError } from "@/utils/processes/manual/errors";
import { logger } from "@/utils/logger";
import type { ProcessResponse } from "@/components/ProcessModal/types";

jest.mock("@/utils/logger", () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe("useProcessButton", () => {
  const mockRefetch = jest.fn().mockResolvedValue(undefined);
  const minimalButton: any = { id: "btn-1", processInfo: { parameters: [] } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleProcessClick — error handling", () => {
    it("re-throws LegacyProcessUnresolvedError without wrapping in responseActions", async () => {
      const legacyError = new LegacyProcessUnresolvedError("btn-1", "DocAction");
      const executeProcess = jest.fn().mockRejectedValue(legacyError);

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      await expect(result.current.handleProcessClick(minimalButton, "rec-1")).rejects.toThrow(
        LegacyProcessUnresolvedError
      );
    });

    it("logs a single warn for LegacyProcessUnresolvedError before re-throwing", async () => {
      const legacyError = new LegacyProcessUnresolvedError("btn-1");
      const executeProcess = jest.fn().mockRejectedValue(legacyError);

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      await expect(result.current.handleProcessClick(minimalButton, "rec-1")).rejects.toThrow();
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith("Error executing process", legacyError);
    });

    it("wraps a generic Error in responseActions instead of throwing", async () => {
      const genericError = new Error("Something went wrong");
      const executeProcess = jest.fn().mockRejectedValue(genericError);

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      const response = await result.current.handleProcessClick(minimalButton, "rec-1");

      expect(response.responseActions?.[0]?.showMsgInProcessView).toEqual({
        msgType: "error",
        msgTitle: "Error",
        msgText: "Something went wrong",
      });
    });

    it("wraps a non-Error rejection with 'Unknown error occurred'", async () => {
      const executeProcess = jest.fn().mockRejectedValue("plain string error");

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      const response = await result.current.handleProcessClick(minimalButton, "rec-1");

      expect(response.responseActions?.[0]?.showMsgInProcessView?.msgText).toBe("Unknown error occurred");
    });

    it("logs a single warn for generic errors too", async () => {
      const genericError = new Error("oops");
      const executeProcess = jest.fn().mockRejectedValue(genericError);

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      await result.current.handleProcessClick(minimalButton, "rec-1");

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith("Error executing process", genericError);
    });
  });

  describe("handleProcessClick — happy path", () => {
    it("throws when recordId is undefined", async () => {
      const executeProcess = jest.fn();

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      await expect(result.current.handleProcessClick(minimalButton, undefined)).rejects.toThrow("No record selected");
      expect(executeProcess).not.toHaveBeenCalled();
    });

    it("calls refetch when response has refreshParent: true", async () => {
      const successResponse: ProcessResponse = { refreshParent: true };
      const executeProcess = jest.fn().mockResolvedValue(successResponse);

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      await result.current.handleProcessClick(minimalButton, "rec-1");

      expect(mockRefetch).toHaveBeenCalled();
    });

    it("does not call refetch when response has refreshParent: false", async () => {
      const successResponse: ProcessResponse = { refreshParent: false };
      const executeProcess = jest.fn().mockResolvedValue(successResponse);

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      await result.current.handleProcessClick(minimalButton, "rec-1");

      expect(mockRefetch).not.toHaveBeenCalled();
    });

    it("returns the response from executeProcess on success", async () => {
      const successResponse: ProcessResponse = { showInIframe: true, iframeUrl: "http://example.com" };
      const executeProcess = jest.fn().mockResolvedValue(successResponse);

      const { result } = renderHook(() => useProcessButton(executeProcess, mockRefetch));

      const response = await result.current.handleProcessClick(minimalButton, "rec-1");

      expect(response).toBe(successResponse);
    });
  });
});

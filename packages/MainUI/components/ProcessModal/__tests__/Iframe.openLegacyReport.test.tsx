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

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProcessIframeModal from "../Iframe";
import { LEGACY_ACTIONS, LEGACY_MESSAGE_TYPE } from "../legacyMessageProtocol";

// These integration-style tests render the legacy report iframe modal and drive async
// postMessage handlers. Under heavy parallel test load the render + effects can exceed the
// default per-test budget purely due to CPU contention (the assertions are correct), so widen
// the per-test timeout for this file and give the async waits extra headroom.
jest.setTimeout(30000);
const ASYNC_WAIT = { timeout: 5000 };

const mockTryOpenReportPopup = jest.fn();
const mockBuildEtendoClassicBookmarkUrl = jest.fn(
  (args: { processUrl: string; params?: string }) => `bookmark(${args.processUrl}|${args.params ?? ""})`
);

jest.mock("@/utils/reportPopup", () => ({
  tryOpenReportPopup: (popupUrl: string) => mockTryOpenReportPopup(popupUrl),
  REPORT_POPUP_TARGET: "EtendoLegacyReport",
  REPORT_POPUP_FEATURES: "width=950,height=700",
}));

jest.mock("@/utils/url/utils", () => ({
  buildEtendoClassicBookmarkUrl: (args: {
    baseUrl: string;
    processUrl: string;
    tabTitle: string;
    kioskMode: boolean;
    token: string | null;
    params?: string;
  }) => mockBuildEtendoClassicBookmarkUrl(args),
}));

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ token: "JWT" }),
}));

jest.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => ({ config: { etendoClassicHost: "http://localhost:8080/etendo" } }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/hooks/useProcessMessage", () => ({
  useProcessMessage: () => ({ fetchProcessMessage: jest.fn().mockResolvedValue(null) }),
}));

jest.mock("@/utils/logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}));

const renderModal = (overrides: Partial<Parameters<typeof ProcessIframeModal>[0]> = {}) => {
  const onClose = jest.fn();
  const result = render(
    <ProcessIframeModal
      isOpen
      onClose={onClose}
      url="http://localhost:8080/etendo/meta/legacy/SalesInvoice/Header_Edition.html"
      title="Test"
      tabId="tab-id"
      formParams={{ Command: "BUTTONPosted" }}
      {...overrides}
    />
  );
  return { ...result, onClose };
};

const dispatchAction = (data: Record<string, unknown>) => {
  fireEvent(window, new MessageEvent("message", { data }));
};

describe("Iframe.tsx — openLegacyReport handler", () => {
  beforeEach(() => {
    mockTryOpenReportPopup.mockReset();
    mockBuildEtendoClassicBookmarkUrl.mockClear();
  });

  it("passes processUrl/tabTitle/params/baseUrl/token/kioskMode to buildEtendoClassicBookmarkUrl per report", async () => {
    // Backend has already stripped the public host and split the URL into
    // processUrl + params; the handler should forward those values verbatim
    // (kioskMode hardcoded true) and reuse the runtime publicHost + token.
    mockTryOpenReportPopup.mockReturnValue(true);
    const { onClose } = renderModal();

    await act(async () => {
      dispatchAction({
        type: LEGACY_MESSAGE_TYPE,
        action: LEGACY_ACTIONS.OPEN_LEGACY_REPORT,
        payload: {
          reports: [
            {
              processUrl: "/ad_reports/A.html",
              tabTitle: "Journal Entries Report",
              params: "Command=DIRECT&inpRecord=1",
            },
            {
              processUrl: "/ad_reports/B.html",
              tabTitle: "Journal Entries Report",
              params: "Command=DIRECT&inpRecord=2",
            },
          ],
        },
      });
    });

    expect(mockBuildEtendoClassicBookmarkUrl).toHaveBeenCalledTimes(2);
    expect(mockBuildEtendoClassicBookmarkUrl).toHaveBeenNthCalledWith(1, {
      baseUrl: "http://localhost:8080/etendo",
      processUrl: "/ad_reports/A.html",
      tabTitle: "Journal Entries Report",
      kioskMode: true,
      token: "JWT",
      params: "Command=DIRECT&inpRecord=1",
    });
    expect(mockBuildEtendoClassicBookmarkUrl).toHaveBeenNthCalledWith(2, {
      baseUrl: "http://localhost:8080/etendo",
      processUrl: "/ad_reports/B.html",
      tabTitle: "Journal Entries Report",
      kioskMode: true,
      token: "JWT",
      params: "Command=DIRECT&inpRecord=2",
    });
    expect(mockTryOpenReportPopup).toHaveBeenCalledTimes(2);
    expect(mockTryOpenReportPopup).toHaveBeenNthCalledWith(
      1,
      "bookmark(/ad_reports/A.html|Command=DIRECT&inpRecord=1)"
    );
    expect(mockTryOpenReportPopup).toHaveBeenNthCalledWith(
      2,
      "bookmark(/ad_reports/B.html|Command=DIRECT&inpRecord=2)"
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), ASYNC_WAIT);
  });

  it("forwards an empty params string when the backend omits the report query", async () => {
    mockTryOpenReportPopup.mockReturnValue(true);
    renderModal();

    await act(async () => {
      dispatchAction({
        type: LEGACY_MESSAGE_TYPE,
        action: LEGACY_ACTIONS.OPEN_LEGACY_REPORT,
        payload: {
          reports: [{ processUrl: "/ad_reports/A.html", tabTitle: "T", params: "" }],
        },
      });
    });

    expect(mockBuildEtendoClassicBookmarkUrl).toHaveBeenCalledWith(
      expect.objectContaining({ processUrl: "/ad_reports/A.html", params: "" })
    );
  });

  it("does NOT close the modal when at least one popup is blocked and renders the CTA", async () => {
    mockTryOpenReportPopup.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const { onClose } = renderModal();

    await act(async () => {
      dispatchAction({
        type: LEGACY_MESSAGE_TYPE,
        action: LEGACY_ACTIONS.OPEN_LEGACY_REPORT,
        payload: {
          reports: [
            { processUrl: "/a", tabTitle: "T", params: "" },
            { processUrl: "/b", tabTitle: "T", params: "" },
          ],
        },
      });
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByTestId("LegacyReportPopupBlocked__banner")).toBeTruthy();
  });

  it("retries the blocked URLs only when the user clicks the CTA, and closes the modal on success", async () => {
    mockTryOpenReportPopup
      // First handle: A succeeds, B blocked
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      // Retry: B succeeds
      .mockReturnValueOnce(true);
    const { onClose } = renderModal();

    await act(async () => {
      dispatchAction({
        type: LEGACY_MESSAGE_TYPE,
        action: LEGACY_ACTIONS.OPEN_LEGACY_REPORT,
        payload: {
          reports: [
            { processUrl: "/a", tabTitle: "T", params: "" },
            { processUrl: "/b", tabTitle: "T", params: "" },
          ],
        },
      });
    });

    const retry = await screen.findByTestId("LegacyReportPopupBlocked__retry");
    fireEvent.click(retry);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), ASYNC_WAIT);
    // 2 from initial dispatch + 1 retry of the only blocked URL
    expect(mockTryOpenReportPopup).toHaveBeenCalledTimes(3);
  });

  it("ignores openLegacyReport messages without payload.reports", async () => {
    mockTryOpenReportPopup.mockReturnValue(true);
    const { onClose } = renderModal();

    await act(async () => {
      dispatchAction({
        type: LEGACY_MESSAGE_TYPE,
        action: LEGACY_ACTIONS.OPEN_LEGACY_REPORT,
        payload: {},
      });
    });

    expect(mockTryOpenReportPopup).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores openLegacyReport messages with empty reports array", async () => {
    mockTryOpenReportPopup.mockReturnValue(true);
    const { onClose } = renderModal();

    await act(async () => {
      dispatchAction({
        type: LEGACY_MESSAGE_TYPE,
        action: LEGACY_ACTIONS.OPEN_LEGACY_REPORT,
        payload: { reports: [] },
      });
    });

    expect(mockTryOpenReportPopup).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores openLegacyReport messages whose entries do not match the expected shape", async () => {
    // Defensive: a malformed payload (legacy backend with the old `urls: string[]`
    // shape, or a stray entry missing fields) should NOT trigger the bookmark
    // builder — the regular pipeline keeps handling the response.
    mockTryOpenReportPopup.mockReturnValue(true);
    const { onClose } = renderModal();

    await act(async () => {
      dispatchAction({
        type: LEGACY_MESSAGE_TYPE,
        action: LEGACY_ACTIONS.OPEN_LEGACY_REPORT,
        payload: { reports: ["/a", "/b"] },
      });
    });

    expect(mockBuildEtendoClassicBookmarkUrl).not.toHaveBeenCalled();
    expect(mockTryOpenReportPopup).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

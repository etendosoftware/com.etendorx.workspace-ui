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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { LEGACY_ACTIONS, LEGACY_MESSAGE_TYPE } from "@/components/ProcessModal/legacyMessageProtocol";
import AuditTrailModal from "../AuditTrailModal";

jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const POPUP_URL = "http://host/etendo/meta/legacy/businessUtility/AuditTrail.html?Command=POPUP_HISTORY";

const renderModal = (isOpen = true) => {
  const onClose = jest.fn();
  const view = render(<AuditTrailModal isOpen={isOpen} url={isOpen ? POPUP_URL : ""} onClose={onClose} />);
  return { onClose, ...view };
};

const postFromIframe = (data: unknown) => {
  act(() => {
    window.dispatchEvent(new MessageEvent("message", { data }));
  });
};

const getIframe = () => screen.getByTitle("auditTrail.iframeTitle");

describe("AuditTrailModal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders nothing when closed", () => {
    renderModal(false);
    expect(screen.queryByText("auditTrail.title")).not.toBeInTheDocument();
  });

  it("embeds the classic popup and shows the loading overlay until it loads", () => {
    renderModal();

    expect(screen.getByText("auditTrail.title")).toBeInTheDocument();
    expect(getIframe()).toHaveAttribute("src", POPUP_URL);
    expect(screen.getByText("auditTrail.loading")).toBeInTheDocument();

    fireEvent.load(getIframe());

    expect(screen.queryByText("auditTrail.loading")).not.toBeInTheDocument();
  });

  it("closes from the modal close button", () => {
    const { onClose } = renderModal();

    fireEvent.click(screen.getByTestId("close-button"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the popup's Close button posts closeModal", () => {
    const { onClose } = renderModal();

    postFromIframe({ type: LEGACY_MESSAGE_TYPE, action: LEGACY_ACTIONS.CLOSE_MODAL });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error and closes when the legacy request fails", () => {
    const { onClose } = renderModal();

    postFromIframe({ type: LEGACY_MESSAGE_TYPE, action: LEGACY_ACTIONS.REQUEST_FAILED });

    expect(toast.error).toHaveBeenCalledWith("auditTrail.requestFailed");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["navigation messages", { type: LEGACY_MESSAGE_TYPE, action: LEGACY_ACTIONS.IFRAME_UNLOADED }],
    ["form submissions", { type: LEGACY_MESSAGE_TYPE, action: LEGACY_ACTIONS.PROCESS_ORDER }],
    ["foreign messages", { type: "other", action: LEGACY_ACTIONS.CLOSE_MODAL }],
    ["empty messages", null],
  ])("ignores %s", (_label, data) => {
    const { onClose } = renderModal();

    postFromIframe(data);

    expect(onClose).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("stops listening once closed", () => {
    const { onClose, rerender } = renderModal();

    rerender(<AuditTrailModal isOpen={false} url="" onClose={onClose} />);
    postFromIframe({ type: LEGACY_MESSAGE_TYPE, action: LEGACY_ACTIONS.CLOSE_MODAL });

    expect(onClose).not.toHaveBeenCalled();
  });
});

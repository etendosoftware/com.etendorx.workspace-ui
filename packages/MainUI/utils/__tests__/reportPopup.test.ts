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

import {
  REPORT_POPUP_FEATURES,
  REPORT_POPUP_TARGET,
  notifyReportPopupBlocked,
  tryOpenReportPopup,
} from "../reportPopup";
import { toast } from "sonner";

jest.mock("sonner", () => ({ toast: { warning: jest.fn() } }));

describe("tryOpenReportPopup", () => {
  let originalWindowOpen: typeof window.open;
  let mockWindowOpen: jest.Mock;

  beforeEach(() => {
    originalWindowOpen = window.open;
    mockWindowOpen = jest.fn();
    window.open = mockWindowOpen;
  });

  afterEach(() => {
    window.open = originalWindowOpen;
  });

  it("returns true and forwards the standard popup features when the browser opens the popup", () => {
    mockWindowOpen.mockReturnValueOnce({ closed: false } as Window);

    const opened = tryOpenReportPopup("http://x/report");

    expect(opened).toBe(true);
    expect(mockWindowOpen).toHaveBeenCalledWith("http://x/report", REPORT_POPUP_TARGET, REPORT_POPUP_FEATURES);
  });

  it("returns false when window.open returns null (popup blocker active)", () => {
    mockWindowOpen.mockReturnValueOnce(null);

    expect(tryOpenReportPopup("http://x/report")).toBe(false);
  });

  it("returns false when the returned popup is already closed", () => {
    mockWindowOpen.mockReturnValueOnce({ closed: true } as Window);

    expect(tryOpenReportPopup("http://x/report")).toBe(false);
  });
});

describe("notifyReportPopupBlocked", () => {
  beforeEach(() => {
    (toast.warning as jest.Mock).mockReset();
  });

  it("emits a sonner warning with the provided title and an action button", () => {
    const retry = jest.fn();
    notifyReportPopupBlocked(retry, { title: "Blocked", openLabel: "Open report" });

    expect(toast.warning).toHaveBeenCalledTimes(1);
    const [title, options] = (toast.warning as jest.Mock).mock.calls[0];
    expect(title).toBe("Blocked");
    expect(options.action.label).toBe("Open report");
    expect(typeof options.action.onClick).toBe("function");
  });

  it("forwards the retry callback as the action click handler", () => {
    const retry = jest.fn();
    notifyReportPopupBlocked(retry, { title: "Blocked", openLabel: "Open report" });

    const [, options] = (toast.warning as jest.Mock).mock.calls[0];
    options.action.onClick();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

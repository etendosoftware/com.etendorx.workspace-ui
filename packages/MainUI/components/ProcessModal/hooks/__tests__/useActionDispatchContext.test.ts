/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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

import { renderHook } from "@testing-library/react";
import { useActionDispatchContext } from "../useActionDispatchContext";
import { getActionDispatchContext } from "@/utils/processes/definition/actionDispatcherStore";
import type { CallerField } from "@/utils/processes/definition/scriptProxies";
import { browseReport, downloadReport } from "@/utils/processes/definition/reportActions";
import { messageBar } from "@/utils/processes/definition/messageBarStore";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/contexts/RuntimeConfigContext", () => ({
  useRuntimeConfig: () => ({ config: { etendoClassicHost: "" } }),
}));
jest.mock("@/utils/processes/definition/reportActions", () => ({
  browseReport: jest.fn(),
  downloadReport: jest.fn(),
}));
jest.mock("@/utils/processes/definition/messageBarStore", () => ({
  messageBar: { setMessage: jest.fn() },
}));

const TOKEN = "tok-123";
const REPORT_PAYLOAD = {
  processParameters: { actionHandler: "Handler", reportId: "REP-1", processId: "PROC-1" },
  tmpfileName: "tmp.pdf",
  fileName: "Report.pdf",
};

const baseParams = () => ({
  refreshParentGrid: jest.fn(),
  refreshModalGrid: jest.fn(),
  navigateToTab: jest.fn(),
  closeModal: jest.fn(),
  token: TOKEN,
});

/** Mounts the hook and returns the context it registered in the dispatch store. */
const mountContext = (callerField?: CallerField) => {
  renderHook(() => useActionDispatchContext({ ...baseParams(), callerField }));
  const ctx = getActionDispatchContext();
  if (!ctx) throw new Error("dispatch context was not registered");
  return ctx;
};

/** Invokes the `onError` argument a report helper mock received at `argIndex`. */
const triggerOnError = (helper: jest.Mock, argIndex: number) => {
  const onError = helper.mock.calls[0][argIndex] as () => void;
  onError();
};

describe("useActionDispatchContext — report file errors", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows an error in the message bar when the browsed report cannot be opened", () => {
    mountContext().browseReport(REPORT_PAYLOAD);

    expect(browseReport).toHaveBeenCalledWith(expect.stringContaining("mode=BROWSE"), TOKEN, expect.any(Function));
    triggerOnError(browseReport as jest.Mock, 2);
    expect(messageBar.setMessage).toHaveBeenCalledWith("error", null, "process.reportFileFailed");
  });

  it("shows an error in the message bar when the report file cannot be downloaded", () => {
    mountContext().downloadReport(REPORT_PAYLOAD);

    expect(downloadReport).toHaveBeenCalledWith(
      expect.stringContaining("mode=DOWNLOAD"),
      TOKEN,
      REPORT_PAYLOAD.fileName,
      expect.any(Function)
    );
    triggerOnError(downloadReport as jest.Mock, 3);
    expect(messageBar.setMessage).toHaveBeenCalledWith("error", null, "process.reportFileFailed");
  });
});

describe("useActionDispatchContext — setSelectorValueFromRecord", () => {
  const RECORD = { value: "PAY-1", map: "Payment 1" };

  it("writes the record into the selector that launched the process", () => {
    const setValueFromRecord = jest.fn();

    mountContext({ id: "F-PAYMENT", setValueFromRecord }).setSelectorValueFromRecord({ record: RECORD });

    expect(setValueFromRecord).toHaveBeenCalledWith(RECORD);
  });

  it("only warns when the process was not launched from a selector", () => {
    expect(() => mountContext({ id: "BUTTON" }).setSelectorValueFromRecord({ record: RECORD })).not.toThrow();
  });
});

describe("useActionDispatchContext — registration", () => {
  it("registers nothing while the modal is closed, and registers when it opens", () => {
    const { rerender } = renderHook(({ active }) => useActionDispatchContext({ ...baseParams(), active }), {
      initialProps: { active: false },
    });
    expect(getActionDispatchContext()).toBeNull();

    rerender({ active: true });

    expect(getActionDispatchContext()).not.toBeNull();
  });

  it("keeps a nested modal on top when the launcher rebuilds its handlers", () => {
    const launcher = renderHook(({ token }) => useActionDispatchContext({ ...baseParams(), token }), {
      initialProps: { token: TOKEN },
    });
    const nestedRefresh = jest.fn();
    renderHook(() => useActionDispatchContext({ ...baseParams(), refreshParentGrid: nestedRefresh }));

    launcher.rerender({ token: "tok-new" });
    getActionDispatchContext()?.refreshParentGrid();

    expect(nestedRefresh).toHaveBeenCalledTimes(1);
  });

  it("gives the launcher its handlers back when the nested modal closes", () => {
    const launcherRefresh = jest.fn();
    renderHook(() => useActionDispatchContext({ ...baseParams(), refreshParentGrid: launcherRefresh }));
    const nested = renderHook(() => useActionDispatchContext(baseParams()));

    nested.unmount();
    getActionDispatchContext()?.refreshParentGrid();

    expect(launcherRefresh).toHaveBeenCalledTimes(1);
  });
});

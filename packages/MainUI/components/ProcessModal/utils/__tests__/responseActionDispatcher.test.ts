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
  type ActionDispatchContext,
  type DispatchedAction,
  buildReportActionUrl,
  dispatchResponseAction,
  dispatchResponseActions,
  findFirstMessage,
  findFirstOpenDirectTab,
  readDispatchableResponseActions,
  readResponseActions,
} from "../responseActionDispatcher";

/** Builds a fully-mocked dispatch context for router assertions. */
const makeCtxMock = (): jest.Mocked<ActionDispatchContext> => ({
  showMessageInProcessView: jest.fn(),
  showMessageInView: jest.fn(),
  openDirectTab: jest.fn(),
  refreshParentGrid: jest.fn(),
  refreshGridParameter: jest.fn(),
  setSelectorValueFromRecord: jest.fn(),
  say: jest.fn(),
  browseReport: jest.fn(),
  downloadReport: jest.fn(),
});

describe("readResponseActions", () => {
  it("returns the array when responseActions is at the top level", () => {
    const data = { responseActions: [{ refreshGrid: {} }] };
    expect(readResponseActions(data)).toEqual([{ refreshGrid: {} }]);
  });

  it("returns the array when nested under response", () => {
    const data = { response: { responseActions: [{ refreshGrid: {} }] } };
    expect(readResponseActions(data)).toEqual([{ refreshGrid: {} }]);
  });

  it("returns the array when nested under response.data", () => {
    const data = { response: { data: { responseActions: [{ refreshGrid: {} }] } } };
    expect(readResponseActions(data)).toEqual([{ refreshGrid: {} }]);
  });

  it("returns an empty array when responseActions is absent", () => {
    expect(readResponseActions({})).toEqual([]);
    expect(readResponseActions({ response: {} })).toEqual([]);
    expect(readResponseActions({ response: { data: {} } })).toEqual([]);
  });

  it("returns an empty array when responseActions is not an array", () => {
    expect(readResponseActions({ responseActions: { showMsgInView: {} } })).toEqual([]);
    expect(readResponseActions({ responseActions: "oops" })).toEqual([]);
  });

  it("returns an empty array for non-object inputs", () => {
    expect(readResponseActions(null)).toEqual([]);
    expect(readResponseActions(undefined)).toEqual([]);
    expect(readResponseActions("string")).toEqual([]);
    expect(readResponseActions(42)).toEqual([]);
  });
});

describe("dispatchResponseActions", () => {
  it("normalizes showMsgInProcessView into a processView message action", () => {
    const data = {
      responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "Done", msgTitle: "OK" } }],
    };
    expect(dispatchResponseActions(data)).toEqual([
      {
        kind: "message",
        channel: "processView",
        payload: { msgType: "success", msgText: "Done", msgTitle: "OK" },
      },
    ]);
  });

  it("normalizes showMsgInView into a view-channel message action", () => {
    const data = { responseActions: [{ showMsgInView: { msgType: "warning", msgText: "Heads up" } }] };
    expect(dispatchResponseActions(data)).toEqual([
      { kind: "message", channel: "view", payload: { msgType: "warning", msgText: "Heads up" } },
    ]);
  });

  it("normalizes openDirectTab with all fields", () => {
    const payload = { tabId: "T1", recordId: "R1", command: "NEW", wait: true };
    const data = { responseActions: [{ openDirectTab: payload }] };
    expect(dispatchResponseActions(data)).toEqual([{ kind: "openDirectTab", payload }]);
  });

  it("normalizes refreshGrid with empty payload", () => {
    const data = { responseActions: [{ refreshGrid: {} }] };
    expect(dispatchResponseActions(data)).toEqual([{ kind: "refreshGrid", payload: {} }]);
  });

  it("normalizes refreshGridParameter with gridName", () => {
    const data = { responseActions: [{ refreshGridParameter: { gridName: "transactions" } }] };
    expect(dispatchResponseActions(data)).toEqual([
      { kind: "refreshGridParameter", payload: { gridName: "transactions" } },
    ]);
  });

  it("normalizes setSelectorValueFromRecord", () => {
    const data = {
      responseActions: [{ setSelectorValueFromRecord: { record: { value: "X", map: "Identifier" } } }],
    };
    expect(dispatchResponseActions(data)).toEqual([
      { kind: "setSelectorValueFromRecord", payload: { record: { value: "X", map: "Identifier" } } },
    ]);
  });

  it("normalizes smartclientSay", () => {
    const data = { responseActions: [{ smartclientSay: { message: "<b>hello</b>" } }] };
    expect(dispatchResponseActions(data)).toEqual([{ kind: "smartclientSay", payload: { message: "<b>hello</b>" } }]);
  });

  it("normalizes OBUIAPP_browseReport / OBUIAPP_downloadReport", () => {
    const payload = { processParameters: { reportId: "REP1" }, fileName: "out.pdf" };
    expect(dispatchResponseActions({ responseActions: [{ OBUIAPP_browseReport: payload }] })).toEqual([
      { kind: "browseReport", payload },
    ]);
    expect(dispatchResponseActions({ responseActions: [{ OBUIAPP_downloadReport: payload }] })).toEqual([
      { kind: "downloadReport", payload },
    ]);
  });

  it("preserves the order of multiple actions and includes every supported kind", () => {
    const data = {
      responseActions: [
        { showMsgInProcessView: { msgType: "success", msgText: "Done" } },
        { openDirectTab: { tabId: "T1", recordId: "R1" } },
        { refreshGrid: {} },
      ],
    };
    const out = dispatchResponseActions(data);
    expect(out.map((a) => a.kind)).toEqual(["message", "openDirectTab", "refreshGrid"]);
  });

  it("silently skips unknown action keys", () => {
    const data = {
      responseActions: [{ totallyMadeUp: { foo: 1 } }, { showMsgInView: { msgText: "ok" } }],
    };
    const out = dispatchResponseActions(data);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "message", channel: "view" });
  });

  it("skips actions whose payload is missing or not an object", () => {
    const data = { responseActions: [{ showMsgInView: null }, { openDirectTab: "bad" }] };
    expect(dispatchResponseActions(data)).toEqual([]);
  });

  it("returns an empty list when responseActions itself is missing", () => {
    expect(dispatchResponseActions({})).toEqual([]);
  });
});

describe("findFirstMessage / findFirstOpenDirectTab", () => {
  it("findFirstMessage returns the first message action regardless of channel", () => {
    const actions = dispatchResponseActions({
      responseActions: [
        { refreshGrid: {} },
        { showMsgInView: { msgType: "warning", msgText: "Watch out" } },
        { showMsgInProcessView: { msgType: "success", msgText: "Done" } },
      ],
    });
    expect(findFirstMessage(actions)).toEqual({
      channel: "view",
      payload: { msgType: "warning", msgText: "Watch out" },
    });
  });

  it("findFirstMessage returns null when no message action is present", () => {
    const actions = dispatchResponseActions({ responseActions: [{ refreshGrid: {} }] });
    expect(findFirstMessage(actions)).toBeNull();
  });

  it("findFirstOpenDirectTab returns the structured navigation payload", () => {
    const actions = dispatchResponseActions({
      responseActions: [{ openDirectTab: { tabId: "T1", recordId: "R1" } }, { refreshGrid: {} }],
    });
    expect(findFirstOpenDirectTab(actions)).toEqual({ tabId: "T1", recordId: "R1" });
  });

  it("findFirstOpenDirectTab returns null when no openDirectTab is present", () => {
    const actions = dispatchResponseActions({
      responseActions: [{ showMsgInProcessView: { msgText: "ok" } }],
    });
    expect(findFirstOpenDirectTab(actions)).toBeNull();
  });
});

describe("dispatchResponseAction", () => {
  it("routes a processView message to showMessageInProcessView", () => {
    const ctx = makeCtxMock();
    const payload = { msgType: "success", msgText: "Done" };
    dispatchResponseAction({ kind: "message", channel: "processView", payload }, ctx);
    expect(ctx.showMessageInProcessView).toHaveBeenCalledWith(payload);
    expect(ctx.showMessageInView).not.toHaveBeenCalled();
  });

  it("routes a view message to showMessageInView", () => {
    const ctx = makeCtxMock();
    const payload = { msgType: "warning", msgText: "Heads up" };
    dispatchResponseAction({ kind: "message", channel: "view", payload }, ctx);
    expect(ctx.showMessageInView).toHaveBeenCalledWith(payload);
  });

  it("routes openDirectTab / refreshGrid / refreshGridParameter / setSelectorValueFromRecord", () => {
    const ctx = makeCtxMock();
    const cases: DispatchedAction[] = [
      { kind: "openDirectTab", payload: { tabId: "T1" } },
      { kind: "refreshGrid", payload: {} },
      { kind: "refreshGridParameter", payload: { gridName: "g" } },
      { kind: "setSelectorValueFromRecord", payload: { record: { value: "X" } } },
    ];
    for (const action of cases) dispatchResponseAction(action, ctx);
    expect(ctx.openDirectTab).toHaveBeenCalledWith({ tabId: "T1" });
    expect(ctx.refreshParentGrid).toHaveBeenCalledTimes(1);
    expect(ctx.refreshGridParameter).toHaveBeenCalledWith({ gridName: "g" });
    expect(ctx.setSelectorValueFromRecord).toHaveBeenCalledWith({ record: { value: "X" } });
  });

  it("calls say only when smartclientSay has a message", () => {
    const ctx = makeCtxMock();
    dispatchResponseAction({ kind: "smartclientSay", payload: { message: "hi" } }, ctx);
    dispatchResponseAction({ kind: "smartclientSay", payload: {} }, ctx);
    expect(ctx.say).toHaveBeenCalledTimes(1);
    expect(ctx.say).toHaveBeenCalledWith("hi");
  });

  it("routes report actions to browseReport / downloadReport", () => {
    const ctx = makeCtxMock();
    const payload = { fileName: "r.pdf" };
    dispatchResponseAction({ kind: "browseReport", payload }, ctx);
    dispatchResponseAction({ kind: "downloadReport", payload }, ctx);
    expect(ctx.browseReport).toHaveBeenCalledWith(payload);
    expect(ctx.downloadReport).toHaveBeenCalledWith(payload);
  });
});

describe("buildReportActionUrl", () => {
  it("assembles the kernel URL with the present fields and mode", () => {
    const url = buildReportActionUrl(
      {
        processParameters: { actionHandler: "Handler", reportId: "REP1", processId: "PROC1" },
        tmpfileName: "tmp123",
        fileName: "out.pdf",
      },
      "BROWSE"
    );
    expect(url).toContain("/api/erp/org.openbravo.client.kernel?");
    expect(url).toContain("_action=Handler");
    expect(url).toContain("reportId=REP1");
    expect(url).toContain("processId=PROC1");
    expect(url).toContain("tmpfileName=tmp123");
    expect(url).toContain("fileName=out.pdf");
    expect(url).toContain("mode=BROWSE");
  });

  it("omits absent fields but always sets the mode", () => {
    const url = buildReportActionUrl({}, "DOWNLOAD");
    expect(url).toBe("/api/erp/org.openbravo.client.kernel?mode=DOWNLOAD");
  });
});

describe("readDispatchableResponseActions", () => {
  const VAT_RESPONSE = {
    responseActions: [
      { refreshGridParameter: { gridName: "Accounts" } },
      { refreshGrid: {} },
      { showVATGrid: {} },
      { updateVATTotal: { amount: "0.00" } },
      { updateVATLines: { accounts: [] } },
    ],
  };

  it("keeps process-registered (custom) actions and built-in grid refreshes", () => {
    expect(readDispatchableResponseActions(VAT_RESPONSE)).toEqual(VAT_RESPONSE.responseActions);
  });

  it("drops the keys already handled by the success/navigation flow", () => {
    const data = {
      responseActions: [
        { showMsgInProcessView: { msgText: "done" } },
        { showMsgInView: { msgText: "done" } },
        { openDirectTab: { tabId: "T1" } },
        { showVATGrid: {} },
      ],
    };
    expect(readDispatchableResponseActions(data)).toEqual([{ showVATGrid: {} }]);
  });

  it("returns [] when there are no response actions", () => {
    expect(readDispatchableResponseActions({})).toEqual([]);
    expect(readDispatchableResponseActions(null)).toEqual([]);
  });
});

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
  dispatchResponseActions,
  findFirstMessage,
  findFirstOpenDirectTab,
  readResponseActions,
} from "../responseActionDispatcher";

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
      responseActions: [
        { showMsgInProcessView: { msgType: "success", msgText: "Done", msgTitle: "OK" } },
      ],
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
    expect(dispatchResponseActions(data)).toEqual([
      { kind: "smartclientSay", payload: { message: "<b>hello</b>" } },
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

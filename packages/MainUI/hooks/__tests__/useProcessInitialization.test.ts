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
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { PROCESS_TYPES } from "@/utils/processes/definition/constants";
import { useProcessInitialization } from "../useProcessInitialization";

jest.mock("@/utils/logger", () => ({ logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

const PROCESS_ID = "E68790A7B65F4D45AB35E2BAE34C1F39";
const EXTERNAL_PARAMS = { bankStatementLineId: "BSL-1" };
const TAB = {
  id: "TAB-1",
  window: "WIN-1",
  table: "TABLE-1",
  entityName: "FIN_Financial_Account",
  fields: {},
} as unknown as Tab;

const post = jest.spyOn(Metadata.kernelClient, "post");

/** Renders the hook and returns the body of the defaults request it sends. */
const sentPayload = async (props: Partial<Parameters<typeof useProcessInitialization>[0]>) => {
  renderHook(() =>
    useProcessInitialization({ processId: PROCESS_ID, type: PROCESS_TYPES.PROCESS_DEFINITION, ...props })
  );
  await waitFor(() => expect(post).toHaveBeenCalled());
  return post.mock.calls[0][1] as Record<string, unknown>;
};

describe("useProcessInitialization — externalParams in the defaults context", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { defaults: {} } } as never);
  });

  it("adds them to the payload built from the launching record and tab", async () => {
    const payload = await sentPayload({ record: { id: "FA-1" }, tab: TAB, externalParams: EXTERNAL_PARAMS });

    expect(payload).toEqual(expect.objectContaining({ ...EXTERNAL_PARAMS, inpTabId: "TAB-1", processId: PROCESS_ID }));
  });

  it("adds them to the basic payload without a launching tab", async () => {
    const payload = await sentPayload({ externalParams: EXTERNAL_PARAMS });

    expect(payload).toEqual(expect.objectContaining({ ...EXTERNAL_PARAMS, processId: PROCESS_ID }));
  });

  it("sends the same payload as before without externalParams", async () => {
    const payload = await sentPayload({ record: { id: "FA-1" }, tab: TAB });

    expect(payload).not.toHaveProperty("bankStatementLineId");
  });
});

describe("useProcessInitialization — callerContext in the defaults context", () => {
  const CALLER_CONTEXT = { trxtype: "BPW", bankStatementLineId: "FROM-CALLER" };

  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({ data: { defaults: {} } } as never);
  });

  it("adds the caller's values after externalParams, so they take precedence", async () => {
    const payload = await sentPayload({
      record: { id: "FA-1" },
      tab: TAB,
      externalParams: EXTERNAL_PARAMS,
      callerContext: CALLER_CONTEXT,
    });

    expect(payload).toEqual(expect.objectContaining({ ...CALLER_CONTEXT, processId: PROCESS_ID }));
  });

  it("adds them to the basic payload without a launching tab", async () => {
    const payload = await sentPayload({ callerContext: CALLER_CONTEXT });

    expect(payload).toEqual(expect.objectContaining({ ...CALLER_CONTEXT, processId: PROCESS_ID }));
  });
});

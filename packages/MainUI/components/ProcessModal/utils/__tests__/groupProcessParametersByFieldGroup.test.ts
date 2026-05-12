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

import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import {
  DEFAULT_PROCESS_PARAM_GROUP_ID,
  groupProcessParametersByFieldGroup,
} from "../groupProcessParametersByFieldGroup";

const GROUP_ORDER_INVOICE_ID = "0C672A3B7CDF416F9522DF3FA5AE4022";
const GROUP_ORDER_INVOICE_LABEL = "Order/Invoice";
const GROUP_STATUS_ID = "STATUS_GROUP_ID";
const GROUP_STATUS_LABEL = "Status";

type ParamOverrides = Partial<ProcessParameter> & { sequenceNumber?: number | string };

const makeParam = (overrides: ParamOverrides = {}): ProcessParameter => {
  const { id, name, fieldGroup, fieldGroup$_identifier, sequenceNumber, ...rest } = overrides;
  return {
    id: id ?? "default-id",
    name: name ?? "default-name",
    fieldGroup,
    fieldGroup$_identifier,
    sequenceNumber: sequenceNumber as unknown as string,
    ...rest,
  } as unknown as ProcessParameter;
};

describe("groupProcessParametersByFieldGroup", () => {
  it("returns an empty array for an empty input", () => {
    expect(groupProcessParametersByFieldGroup([])).toEqual([]);
  });

  it("groups all parameters with no fieldGroup under the default sentinel", () => {
    const params = [makeParam({ id: "p1", sequenceNumber: 10 }), makeParam({ id: "p2", sequenceNumber: 20 })];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(DEFAULT_PROCESS_PARAM_GROUP_ID);
    expect(groups[0].identifier).toBe("");
    expect(groups[0].parameters.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("collapses parameters sharing the same fieldGroup into a single bucket", () => {
    const params = [
      makeParam({
        id: "p1",
        sequenceNumber: 130,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
      makeParam({
        id: "p2",
        sequenceNumber: 140,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
    ];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(GROUP_ORDER_INVOICE_ID);
    expect(groups[0].identifier).toBe(GROUP_ORDER_INVOICE_LABEL);
    expect(groups[0].parameters).toHaveLength(2);
  });

  it("uses the minimum sequenceNumber across members as the group sort key", () => {
    const params = [
      makeParam({ id: "high", sequenceNumber: 200, fieldGroup: GROUP_STATUS_ID }),
      makeParam({ id: "low", sequenceNumber: 50, fieldGroup: GROUP_STATUS_ID }),
      makeParam({ id: "mid", sequenceNumber: 120, fieldGroup: GROUP_STATUS_ID }),
    ];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups).toHaveLength(1);
    expect(groups[0].sequenceNumber).toBe(50);
  });

  it("orders groups by their minimum sequenceNumber", () => {
    const params = [
      makeParam({
        id: "oi-late",
        sequenceNumber: 300,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
      makeParam({ id: "main-early", sequenceNumber: 10 }),
      makeParam({
        id: "oi-early",
        sequenceNumber: 100,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
      makeParam({
        id: "status-mid",
        sequenceNumber: 200,
        fieldGroup: GROUP_STATUS_ID,
        fieldGroup$_identifier: GROUP_STATUS_LABEL,
      }),
    ];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups.map((g) => g.id)).toEqual([DEFAULT_PROCESS_PARAM_GROUP_ID, GROUP_ORDER_INVOICE_ID, GROUP_STATUS_ID]);
  });

  it("treats empty-string fieldGroup as ungrouped", () => {
    const params = [
      makeParam({ id: "p1", sequenceNumber: 10, fieldGroup: "" }),
      makeParam({ id: "p2", sequenceNumber: 20 }),
    ];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(DEFAULT_PROCESS_PARAM_GROUP_ID);
    expect(groups[0].parameters).toHaveLength(2);
  });

  it("preserves insertion order within each group", () => {
    const params = [
      makeParam({
        id: "first",
        sequenceNumber: 100,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
      makeParam({
        id: "second",
        sequenceNumber: 200,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
      makeParam({
        id: "third",
        sequenceNumber: 150,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
    ];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups[0].parameters.map((p) => p.id)).toEqual(["first", "second", "third"]);
  });

  it("captures the identifier from the first parameter encountered in a group", () => {
    const params = [
      makeParam({
        id: "p1",
        sequenceNumber: 10,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        fieldGroup$_identifier: GROUP_ORDER_INVOICE_LABEL,
      }),
      makeParam({
        id: "p2",
        sequenceNumber: 20,
        fieldGroup: GROUP_ORDER_INVOICE_ID,
        // missing identifier on the second one — the first one wins
      }),
    ];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups[0].identifier).toBe(GROUP_ORDER_INVOICE_LABEL);
  });

  it("falls back to 0 when sequenceNumber is missing or non-numeric", () => {
    const params = [makeParam({ id: "p1" }), makeParam({ id: "p2", sequenceNumber: "not-a-number" })];

    const groups = groupProcessParametersByFieldGroup(params);

    expect(groups).toHaveLength(1);
    expect(groups[0].sequenceNumber).toBe(0);
  });
});

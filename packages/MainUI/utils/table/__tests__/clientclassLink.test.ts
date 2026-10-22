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

import type { Column } from "@workspaceui/api-client/src/api/types";
import {
  DEFAULT_LEVEL_VALUES,
  hasClientclassCell,
  isClientclassLinkColumn,
  isLevelImgColumn,
  readLevelValues,
  resolveLevel,
  splitClientclass,
} from "../clientclassLink";

const MATCH_CLIENTCLASS = "APRMMatchStatGridButtonsComponent";
const LINK_CLIENTCLASS = "SalesOrderTabLink";
const AFFINITY_VALUES = ["NO", "dummy1", "dummy2", "AP", "AU"];
const AFFINITY_CLIENTCLASS = `OBLevelImg ${JSON.stringify({ valuesList: AFFINITY_VALUES })}`;

const asColumn = (props: Record<string, unknown>) => props as unknown as Column;

describe("isClientclassLinkColumn", () => {
  it("is a link for a non Yes/No column with a clientclass", () => {
    expect(isClientclassLinkColumn(asColumn({ type: "text", clientclass: LINK_CLIENTCLASS }))).toBe(true);
  });

  it.each([
    ["boolean type", { type: "boolean" }],
    ["YesNo reference", { type: "text", column: { reference: "20" } }],
    ["YesNo identifier", { type: "text", column: { _identifier: "YesNo" } }],
  ])("is not a link for a Yes/No column (%s)", (_label, props) => {
    expect(isClientclassLinkColumn(asColumn({ ...props, clientclass: MATCH_CLIENTCLASS }))).toBe(false);
  });

  it.each([undefined, null, ""])("is not a link without a clientclass (%p)", (clientclass) => {
    expect(isClientclassLinkColumn(asColumn({ type: "text", clientclass }))).toBe(false);
  });
});

describe("splitClientclass", () => {
  it("splits the component name from its JSON properties", () => {
    expect(splitClientclass(AFFINITY_CLIENTCLASS)).toEqual({
      name: "OBLevelImg",
      props: { valuesList: AFFINITY_VALUES },
    });
  });

  it("returns the name without whitespace and no properties when there is no JSON", () => {
    expect(splitClientclass(" OBLevelImg ")).toEqual({ name: "OBLevelImg", props: {} });
  });

  it("ignores invalid JSON properties", () => {
    expect(splitClientclass("OBLevelImg {invalid")).toEqual({ name: "OBLevelImg", props: {} });
  });

  it.each([undefined, null, ""])("returns an empty name for %p", (clientclass) => {
    expect(splitClientclass(clientclass)).toEqual({ name: "", props: {} });
  });
});

describe("level indicator (OBLevelImg)", () => {
  const affinityColumn = asColumn({ type: "text", clientclass: AFFINITY_CLIENTCLASS });

  it.each([
    ["AU", { level: 4, max: 4 }],
    ["AP", { level: 3, max: 4 }],
    ["NO", { level: 0, max: 4 }],
    ["MA", null],
    [null, null],
    ["", null],
  ])("resolves %p as Classic does", (value, expected) => {
    expect(resolveLevel(value, AFFINITY_VALUES)).toEqual(expected);
  });

  it("resolves numeric values on the default scale", () => {
    expect(resolveLevel(2, DEFAULT_LEVEL_VALUES)).toEqual({ level: 2, max: 4 });
  });

  it("reads the valuesList of the clientclass, or the default scale", () => {
    expect(readLevelValues(affinityColumn)).toEqual(AFFINITY_VALUES);
    expect(readLevelValues(asColumn({ clientclass: "OBLevelImg" }))).toBe(DEFAULT_LEVEL_VALUES);
    expect(readLevelValues(asColumn({ clientclass: 'OBLevelImg {"valuesList":[]}' }))).toBe(DEFAULT_LEVEL_VALUES);
  });

  it("is a clientclass cell but not a link", () => {
    expect(isLevelImgColumn(affinityColumn)).toBe(true);
    expect(isClientclassLinkColumn(affinityColumn)).toBe(false);
    expect(hasClientclassCell(affinityColumn)).toBe(true);
  });

  it("keeps links as clientclass cells and Yes/No columns without one", () => {
    expect(hasClientclassCell(asColumn({ type: "text", clientclass: LINK_CLIENTCLASS }))).toBe(true);
    expect(hasClientclassCell(asColumn({ type: "boolean", clientclass: MATCH_CLIENTCLASS }))).toBe(false);
    expect(isLevelImgColumn(asColumn({ type: "text", clientclass: LINK_CLIENTCLASS }))).toBe(false);
  });
});

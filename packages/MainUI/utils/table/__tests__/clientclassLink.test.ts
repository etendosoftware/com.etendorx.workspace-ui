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
import { isClientclassLinkColumn } from "../clientclassLink";

const MATCH_CLIENTCLASS = "APRMMatchStatGridButtonsComponent";

const asColumn = (props: Record<string, unknown>) => props as unknown as Column;

describe("isClientclassLinkColumn", () => {
  it("is a link for a non Yes/No column with a clientclass", () => {
    expect(isClientclassLinkColumn(asColumn({ type: "text", clientclass: "SalesOrderTabLink" }))).toBe(true);
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

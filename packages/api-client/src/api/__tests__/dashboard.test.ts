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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { updateDashboardLayout } from "../dashboard";
import { Metadata } from "../metadata";

jest.mock("../metadata", () => ({
  Metadata: { client: { request: jest.fn() } },
}));

describe("api/dashboard updateDashboardLayout", () => {
  it("sends decimal numbers, keeping half-row positions and the collapsed flag", async () => {
    (Metadata.client.request as jest.Mock).mockResolvedValue({ ok: true, data: { status: "ok" } });

    await updateDashboardLayout({
      widgets: [
        { instanceId: "w1", col: 1, row: 0.5, width: 2, height: 2.5, isVisible: true, isCollapsed: true },
        { instanceId: "w2", col: 0, row: 3, width: 4, height: 2, isVisible: true, isCollapsed: false },
      ],
    });

    const { body } = (Metadata.client.request as jest.Mock).mock.calls[0][1];
    expect(body).toBe(
      '{"widgets":[' +
        '{"instanceId":"w1","col":1.0,"row":0.5,"width":2.0,"height":2.5,"isVisible":true,"isCollapsed":true},' +
        '{"instanceId":"w2","col":0.0,"row":3.0,"width":4.0,"height":2.0,"isVisible":true,"isCollapsed":false}]}'
    );
  });
});

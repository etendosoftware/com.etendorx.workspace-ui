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

import { render, screen } from "@testing-library/react";
import type { NotificationWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import NotificationRenderer, { formatNotificationTime } from "../NotificationRenderer";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => (key === "dashboard.widget.more" ? "+{{count}} more" : key) }),
}));

const ALERT_TIME = "2026-11-18T10:00:00Z";

const dataWith = (items: NotificationWidgetData["items"], totalCount = items.length) =>
  ({ items, totalCount }) as NotificationWidgetData;

describe("NotificationRenderer", () => {
  it("shows an alert with its rule name instead of a priority badge", () => {
    render(
      <NotificationRenderer
        data={dataWith([
          { text: "Product below minimum stock", title: "Stock rule", priority: "normal", time: ALERT_TIME },
        ])}
      />
    );

    expect(screen.getByTestId("NotificationRenderer__title_0")).toHaveTextContent("Stock rule");
    expect(screen.queryByTestId("NotificationRenderer__badge_0")).not.toBeInTheDocument();
    expect(screen.getByText("Product below minimum stock")).toBeInTheDocument();
    expect(screen.getByText(formatNotificationTime(ALERT_TIME))).toBeInTheDocument();
  });

  it("keeps the priority badge for items without a title", () => {
    render(<NotificationRenderer data={dataWith([{ text: "Done", priority: "success", time: ALERT_TIME }])} />);

    expect(screen.getByTestId("NotificationRenderer__badge_0")).toHaveTextContent("success");
  });

  it("tells how many items are not listed, in the user's language", () => {
    render(<NotificationRenderer data={dataWith([{ text: "One", priority: "normal", time: ALERT_TIME }], 4)} />);

    expect(screen.getByTestId("NotificationRenderer__more")).toHaveTextContent("+3 more");
  });

  it("shows the raw time when it is not a date", () => {
    expect(formatNotificationTime("yesterday")).toBe("yesterday");
  });
});

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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { NotificationWidgetData } from "@workspaceui/api-client/src/api/dashboard";
import NotificationRenderer, { formatNotificationTime, getAlertIds } from "../NotificationRenderer";
import { acknowledgeAlerts } from "@workspaceui/api-client/src/api/dashboard";
import { ALERTS_CHANGED_EVENT } from "@/utils/alerts/constants";

const mockOpenAlertManagement = jest.fn();
jest.mock("@/hooks/useOpenAlertManagement", () => ({ useOpenAlertManagement: () => mockOpenAlertManagement }));
jest.mock("@workspaceui/api-client/src/api/dashboard", () => ({ acknowledgeAlerts: jest.fn() }));

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

  const ALERTS = [
    { id: "A1", text: "First", title: "Rule", priority: "normal" as const, time: ALERT_TIME },
    { id: "A2", text: "Second", title: "Rule", priority: "normal" as const, time: ALERT_TIME },
  ];

  it("marks one alert as read, reloads the widget and tells the header indicator", async () => {
    (acknowledgeAlerts as jest.Mock).mockResolvedValue({ acknowledged: 1 });
    const onDataChanged = jest.fn();
    const onAlertsChanged = jest.fn();
    window.addEventListener(ALERTS_CHANGED_EVENT, onAlertsChanged);
    render(<NotificationRenderer data={dataWith(ALERTS)} onDataChanged={onDataChanged} />);

    fireEvent.click(screen.getByTestId("NotificationRenderer__mark_1"));

    await waitFor(() => expect(onDataChanged).toHaveBeenCalled());
    expect(acknowledgeAlerts).toHaveBeenCalledWith(["A2"]);
    expect(onAlertsChanged).toHaveBeenCalled();
    window.removeEventListener(ALERTS_CHANGED_EVENT, onAlertsChanged);
  });

  it("marks every listed alert as read at once", async () => {
    (acknowledgeAlerts as jest.Mock).mockResolvedValue({ acknowledged: 2 });
    render(<NotificationRenderer data={dataWith(ALERTS)} />);

    fireEvent.click(screen.getByTestId("NotificationRenderer__mark_all"));

    await waitFor(() => expect(acknowledgeAlerts).toHaveBeenCalledWith(["A1", "A2"]));
  });

  it("opens Alert Management from View all, also when there is nothing pending", () => {
    render(<NotificationRenderer data={dataWith([])} />);

    expect(screen.getByTestId("NotificationRenderer__empty")).toHaveTextContent("dashboard.widget.emptyNotifications");
    expect(screen.queryByTestId("NotificationRenderer__mark_all")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("NotificationRenderer__view_all"));
    expect(mockOpenAlertManagement).toHaveBeenCalled();
  });

  it("offers no mark action for items without an alert id", () => {
    expect(getAlertIds([{ text: "x", priority: "normal", time: ALERT_TIME }])).toEqual([]);
  });
});

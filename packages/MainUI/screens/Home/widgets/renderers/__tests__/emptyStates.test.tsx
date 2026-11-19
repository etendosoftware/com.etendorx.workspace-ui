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
import type {
  CalendarWidgetData,
  QueryListWidgetData,
  StockAlertWidgetData,
} from "@workspaceui/api-client/src/api/dashboard";
import CalendarRenderer from "../CalendarRenderer";
import QueryListRenderer from "../QueryListRenderer";
import StockAlertRenderer from "../StockAlertRenderer";
import { WIDGET_EMPTY_TEXT_CLASSES } from "../chipClasses";

jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/hooks/navigation/useRedirect", () => ({ useRedirect: () => ({ handleAction: jest.fn() }) }));
jest.mock("@/hooks/useDashboard", () => ({ WIDGET_PAGE_SIZE: 10 }));

describe("widget empty states", () => {
  it.each([
    [
      "StockAlertRenderer",
      () => <StockAlertRenderer data={{ items: [] } as unknown as StockAlertWidgetData} />,
      "dashboard.widget.emptyStockAlerts",
    ],
    [
      "QueryListRenderer",
      () => (
        <QueryListRenderer
          data={{ rows: [], totalRows: 0 } as unknown as QueryListWidgetData}
          onFetchPage={jest.fn()}
        />
      ),
      "dashboard.widget.emptyList",
    ],
    [
      "CalendarRenderer",
      () => <CalendarRenderer data={{ entries: [] } as unknown as CalendarWidgetData} />,
      "dashboard.widget.emptyCalendar",
    ],
  ])("%s explains that there is nothing to show instead of a dash", (name, element, key) => {
    render(element());

    const empty = screen.getByTestId(`${name}__empty`);
    expect(empty).toHaveTextContent(key);
    expect(empty).toHaveClass(...WIDGET_EMPTY_TEXT_CLASSES.split(" "));
  });
});

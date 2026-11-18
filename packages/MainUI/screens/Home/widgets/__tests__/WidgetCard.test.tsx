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
import type { WidgetInstance } from "@workspaceui/api-client/src/api/dashboard";
import WidgetCard, { WIDGET_CARD_THEME } from "../WidgetCard";

jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../WidgetRenderer", () => () => <div />);

const renderCard = (type: WidgetInstance["type"]) =>
  render(
    <WidgetCard
      instance={{ instanceId: type, type, title: type } as unknown as WidgetInstance}
      data={undefined}
      error={undefined}
      onRemove={jest.fn()}
      onFetchPage={jest.fn()}
    />
  );

describe("WidgetCard", () => {
  it.each(["RECENTLY_VIEWED", "RECENT_DOCS", "FAVORITES"] as const)(
    "draws %s on the shared card surface with its type icon",
    (type) => {
      renderCard(type);

      expect(screen.getByTestId(`WidgetCard__${type}`)).toHaveClass(...WIDGET_CARD_THEME.card.split(" "));
      expect(screen.getByTestId(`WidgetTypeIcon__${type}`)).toBeInTheDocument();
    }
  );
});

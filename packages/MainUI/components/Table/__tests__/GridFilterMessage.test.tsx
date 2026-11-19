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

import { fireEvent, render, screen } from "@testing-library/react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import { useServerLabels } from "@/hooks/useServerLabels";
import { useWindowStore } from "@/stores/windowStore";
import { persistPreference } from "@/utils/preferences/persistPreference";
import { savePreferences } from "@/utils/propertyStore";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { FILTER_MESSAGE, FILTER_MESSAGE_TEXTS } from "@/utils/table/filterMessage";
import GridFilterMessage, { buildFilterMessageHtml, type GridFilterMessageProps } from "../GridFilterMessage";

jest.mock("@/hooks/useServerLabels", () => ({ useServerLabels: jest.fn() }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/utils/preferences/persistPreference", () => ({ persistPreference: jest.fn() }));

const WINDOW_IDENTIFIER = "143_1";
const TAB_ID = "186";
const IMPLICIT_TEXT = "This grid is filtered using an implicit filter<i>(Open)</i>.";
const LABELS = {
  [FILTER_MESSAGE_TEXTS.CLEAR_FILTERS]: "Click the funnel icon to clear all filters.",
  [FILTER_MESSAGE_TEXTS.NEVER_SHOW_AGAIN]: "Never show this message again",
  [FILTER_MESSAGE_TEXTS.SINGLE_RECORD]: "The grid is filtered for the last document viewed.",
};
const CONTAINER = "GridFilterMessage__container";

const tab = { id: TAB_ID, window: "143", implicitFilterMessage: IMPLICIT_TEXT } as unknown as Tab;

const renderMessage = (overrides: Partial<GridFilterMessageProps> = {}) =>
  render(
    <GridFilterMessage
      tab={tab}
      windowIdentifier={WINDOW_IDENTIFIER}
      isGridVisible
      isImplicitFilterApplied
      hasIdFilter={false}
      hasParentSelection
      {...overrides}
    />
  );

describe("GridFilterMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installLocalStorageMock();
    savePreferences({});
    (useServerLabels as jest.Mock).mockReturnValue(LABELS);
    useWindowStore.setState({ windows: {} });
  });

  it("shows the implicit filter text and how to clear the filters", () => {
    renderMessage();

    const message = screen.getByTestId(CONTAINER);
    expect(message).toHaveTextContent("This grid is filtered using an implicit filter(Open).");
    expect(message).toHaveTextContent(LABELS[FILTER_MESSAGE_TEXTS.CLEAR_FILTERS]);
  });

  it("shows the single-record message for a grid opened from a link", () => {
    useWindowStore.setState({
      windows: { [WINDOW_IDENTIFIER]: { tabs: { [TAB_ID]: { initializedWithDirectLink: true } } } },
    } as never);

    renderMessage({ hasIdFilter: true });

    expect(screen.getByTestId(CONTAINER)).toHaveTextContent(LABELS[FILTER_MESSAGE_TEXTS.SINGLE_RECORD]);
  });

  it("hides the message when it is closed", () => {
    renderMessage();

    fireEvent.click(screen.getByTestId("GridFilterMessage__close"));

    expect(screen.queryByTestId(CONTAINER)).not.toBeInTheDocument();
  });

  it("stores the preference of the message when the user never wants it again", () => {
    renderMessage();

    fireEvent.click(screen.getByTestId("GridFilterMessage__action"));

    expect(persistPreference).toHaveBeenCalledWith("OBUIAPP_ShowImplicitFilterMsg", "N");
    expect(screen.queryByTestId(CONTAINER)).not.toBeInTheDocument();
  });

  it("shows nothing while the form is on screen", () => {
    renderMessage({ isGridVisible: false });

    expect(screen.queryByTestId(CONTAINER)).not.toBeInTheDocument();
  });

  it("waits for the single-record text and offers no action without its label", () => {
    (useServerLabels as jest.Mock).mockReturnValue({});

    expect(buildFilterMessageHtml(FILTER_MESSAGE.SINGLE_RECORD, tab, {})).toBeUndefined();
    renderMessage();
    expect(screen.getByTestId(CONTAINER)).toHaveTextContent("This grid is filtered using an implicit filter(Open).");
    expect(screen.queryByTestId("GridFilterMessage__action")).not.toBeInTheDocument();
  });
});

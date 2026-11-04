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

import { act, render, screen } from "@testing-library/react";
import { useCalloutHighlightStore } from "@/stores/calloutHighlightStore";
import { CalloutHighlightOverlay } from "../CalloutHighlightOverlay";

const SCOPE = "form:TAB1";
const FIELD = "priceActual";
const OVERLAY_TEST_ID = "callout-highlight";

const highlight = () => act(() => useCalloutHighlightStore.getState().highlightFields(SCOPE, [FIELD]));
const renderOverlay = () => render(<CalloutHighlightOverlay scope={SCOPE} fieldName={FIELD} />);

describe("CalloutHighlightOverlay", () => {
  beforeEach(() => {
    useCalloutHighlightStore.setState({ highlights: {} });
  });

  it("renders nothing while the field is not highlighted", () => {
    renderOverlay();

    expect(screen.queryByTestId(OVERLAY_TEST_ID)).toBeNull();
  });

  it("renders a decorative tint while the field is highlighted", () => {
    renderOverlay();

    highlight();

    const overlay = screen.getByTestId(OVERLAY_TEST_ID);
    expect(overlay).toHaveClass("callout-highlight-overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("remounts the tint on a new highlight so the fade restarts", () => {
    renderOverlay();
    highlight();
    const firstOverlay = screen.getByTestId(OVERLAY_TEST_ID);

    highlight();

    expect(screen.getByTestId(OVERLAY_TEST_ID)).not.toBe(firstOverlay);
  });

  it("ignores the highlights of other fields", () => {
    renderOverlay();

    act(() => useCalloutHighlightStore.getState().highlightFields(SCOPE, ["tax"]));

    expect(screen.queryByTestId(OVERLAY_TEST_ID)).toBeNull();
  });
});

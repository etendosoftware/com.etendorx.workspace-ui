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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { useServerFieldErrorsStore } from "@/stores/serverFieldErrorsStore";
import { ServerFieldErrorOverlay } from "../ServerFieldErrorOverlay";

const SCOPE = "form:TAB1";
const REFERENCE_NO = "referenceNo";
const TOO_LONG = "BusinessPartner.Reference No.: Value too long";
const BORDER_TEST_ID = "server-field-error-border";
const ICON_TEST_ID = "server-field-error-icon";

const renderOverlay = () => render(<ServerFieldErrorOverlay scope={SCOPE} fieldName={REFERENCE_NO} />);

describe("ServerFieldErrorOverlay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useServerFieldErrorsStore.setState({ errors: {} });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when the field has no server error", () => {
    renderOverlay();

    expect(screen.queryByTestId(BORDER_TEST_ID)).not.toBeInTheDocument();
    expect(screen.queryByTestId(ICON_TEST_ID)).not.toBeInTheDocument();
  });

  it("marks the field and shows the message in the icon tooltip", () => {
    useServerFieldErrorsStore.setState({ errors: { [SCOPE]: { [REFERENCE_NO]: TOO_LONG } } });
    renderOverlay();

    expect(screen.getByTestId(BORDER_TEST_ID)).toHaveAttribute("aria-hidden", "true");
    const icon = screen.getByTestId(ICON_TEST_ID);
    expect(icon).toHaveAttribute("aria-label", TOO_LONG);

    fireEvent.mouseEnter(icon.parentElement as HTMLElement);
    act(() => jest.runAllTimers());
    expect(screen.getByRole("tooltip")).toHaveTextContent(TOO_LONG);
  });

  it("disappears when the error is cleared", () => {
    useServerFieldErrorsStore.setState({ errors: { [SCOPE]: { [REFERENCE_NO]: TOO_LONG } } });
    renderOverlay();

    act(() => useServerFieldErrorsStore.getState().clearFieldError(SCOPE, REFERENCE_NO));

    expect(screen.queryByTestId(ICON_TEST_ID)).not.toBeInTheDocument();
  });
});

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

import { render, screen } from "@testing-library/react";
import { FieldTrailingActionContext, getSearchActionClassName, useFieldTrailingAction } from "../FieldTrailingAction";

const ACTION_TEXT = "search";

/** Input stand-in that shows the field action inside itself. */
const HostInput = () => <div data-testid="host">{useFieldTrailingAction()}</div>;

const renderHost = (setHosted = jest.fn()) => {
  const view = render(
    <FieldTrailingActionContext.Provider value={{ action: <button type="button">{ACTION_TEXT}</button>, setHosted }}>
      <HostInput />
    </FieldTrailingActionContext.Provider>
  );
  return { ...view, setHosted };
};

describe("useFieldTrailingAction", () => {
  it("shows the action of the field inside the input", () => {
    renderHost();

    expect(screen.getByTestId("host")).toHaveTextContent(ACTION_TEXT);
  });

  it("tells the field it hosts the action, and that it stopped when it unmounts", () => {
    const { setHosted, unmount } = renderHost();
    expect(setHosted).toHaveBeenLastCalledWith(true);

    unmount();
    expect(setHosted).toHaveBeenLastCalledWith(false);
  });

  it("registers once even when the field passes a new action on each render", () => {
    const setHosted = jest.fn();
    const { rerender } = renderHost(setHosted);
    rerender(
      <FieldTrailingActionContext.Provider value={{ action: <span>{ACTION_TEXT}</span>, setHosted }}>
        <HostInput />
      </FieldTrailingActionContext.Provider>
    );

    expect(setHosted).toHaveBeenCalledTimes(1);
  });

  it("shows nothing outside a field", () => {
    render(<HostInput />);

    expect(screen.getByTestId("host")).toBeEmptyDOMElement();
  });
});

describe("getSearchActionClassName", () => {
  it("draws a borderless icon inside the input box", () => {
    expect(getSearchActionClassName(true)).toContain("bg-transparent");
  });

  it("keeps the round button outside an input that cannot host it", () => {
    expect(getSearchActionClassName(false)).toBe("w-8 h-8 flex-shrink-0");
  });
});

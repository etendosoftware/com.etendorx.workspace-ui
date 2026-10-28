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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "../Select";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "form.select.minCharsHint" ? "Type at least {{min}} characters to search" : key),
  }),
}));

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

const FIELD_NAME = "businessPartner";
const OPTIONS = [
  { id: "1", label: "Alpha Corp" },
  { id: "2", label: "Alpine SA" },
];

const field = {
  id: "field-1",
  hqlName: FIELD_NAME,
  name: "Business Partner",
  isMandatory: false,
  helpComment: "",
} as unknown as Field;

function Harness({ minSearchChars }: { minSearchChars?: number }) {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: "" } });
  return (
    <FormProvider {...methods}>
      <Select name={FIELD_NAME} options={OPTIONS} isReadOnly={false} field={field} minSearchChars={minSearchChars} />
    </FormProvider>
  );
}

const getSearchInput = () => document.querySelector("[data-dropdown-portal] input") as HTMLInputElement;

const openDropdown = () => {
  act(() => {
    fireEvent.click(screen.getByLabelText("Business Partner").querySelector("[tabindex='0']") as HTMLElement);
  });
  act(() => {
    jest.advanceTimersByTime(10);
  });
};

const type = (value: string) => {
  act(() => {
    fireEvent.change(getSearchInput(), { target: { value } });
  });
};

describe("Select — minimum search characters", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("tells the user how many characters are needed in the search placeholder", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    expect(getSearchInput().placeholder).toBe("Type at least 3 characters to search");
  });

  it("shows the default list for an empty term", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    expect(screen.getByTestId("OptionItem__1")).toBeInTheDocument();
  });

  it("replaces the list with the hint while the term is below the minimum", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    type("al");

    expect(screen.getByText("Type at least 3 characters to search")).toBeInTheDocument();
    expect(screen.queryByTestId("OptionItem__1")).not.toBeInTheDocument();
    expect(screen.queryByText("No options found")).not.toBeInTheDocument();
  });

  it("shows the options again once the minimum is reached", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    type("al");
    type("alp");

    expect(screen.getByTestId("OptionItem__1")).toBeInTheDocument();
  });

  it("leaves no stale options visible after deleting below the minimum", () => {
    render(<Harness minSearchChars={3} />);
    openDropdown();

    type("alp");
    type("al");

    expect(screen.queryByTestId("OptionItem__1")).not.toBeInTheDocument();
  });

  it("keeps the usual behavior when there is no minimum", () => {
    render(<Harness />);
    openDropdown();

    type("a");

    expect(getSearchInput().placeholder).toBe("Search...");
    expect(screen.getByTestId("OptionItem__1")).toBeInTheDocument();
  });
});
